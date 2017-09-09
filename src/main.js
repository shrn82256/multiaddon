var components = (function(){

    // creates a dom element with the attributes specified
    // on the attributes object and the given innerHTML
    var createElem = function(type, attributes, innerHTML){
        var elem = document.createElement(type);
        for(var key in attributes){
            elem.setAttribute(key, attributes[key]);
        }
        elem.innerHTML = innerHTML || null;
        return elem;
    };

    var Current = function(attrs){
        this.attrs = attrs;

        this.render = function(){
            var current = createElem('div', {class: 'current'});
            var img = createElem('img', {class: 'current-img', src: this.attrs.img, alt: 'icon'});
            var weather = createElem('div', {class: 'weather'});
            weather.appendChild(createElem('span', {}, this.attrs.temp + '&deg'));
            weather.appendChild(createElem('span', {}, this.attrs.desc));
            current.appendChild(img);
            current.appendChild(weather);
            return current;
        };
    };

    var Period = function(attrs){
        this.attrs = attrs;

        this.render = function(){
            var period = createElem('div', {class: 'period'});

            period.appendChild( createElem('span', {class: 'time'}, this.attrs.time) );
            period.appendChild( createElem('img', {src: this.attrs.img, alt: 'icon'}) );
            period.appendChild( createElem('span', {class: 'temp'}, this.attrs.temp + '&deg') );
            period.appendChild( createElem('span', {class: 'precip'}, this.attrs.precip + this.attrs.length_unit) );

            return period;
        };
    };

    var Today = function(attrs){
        this.attrs = attrs;

        this.render = function(){
            var today = createElem('div', {class: 'today'});

            var period = new Period();
            var num_of_periods = this.attrs.today.length;
            for(var i=0; i<num_of_periods; i++){
                period.attrs = this.attrs.today[i];
                today.appendChild(period.render());
            }

            return today;
        };
    };

    var Day = function(attrs){
        this.attrs = attrs;

        this.render = function(){
            var weather = createElem('div', {class: 'weather'},
                '<span class="temp">' + this.attrs.temp + '&deg</span>' +
                '<span class="description">' + this.attrs.desc + '</span>'
            );
            var date = createElem('div', {class: 'date'},
                '<p class="weekday">' + this.attrs.weekday + '</p>' +
                '<p class="month">' + this.attrs.month + '</p>'
            );
            var imgWrapper = createElem('div', {class: 'img-wrapper'});
            imgWrapper.appendChild(createElem('img', {src: this.attrs.img, alt: 'icon'}));

            var day = createElem('div', {class: 'day'});
            day.appendChild(imgWrapper);
            day.appendChild(weather);
            day.appendChild(date);
            return day;
        };
    };

    var Forecast = function(attrs){
        this.attrs = attrs;

        this.render = function(){
            var forecast = createElem('div', {class: 'forecast'});

            var day = new Day();
            var num_of_days = this.attrs.days.length;
            for(var i=0; i<num_of_days; i++){
                day.attrs = this.attrs.days[i];
                forecast.appendChild(day.render());
            }
            return forecast;
        };
    };

    var Location = function(attrs){
        this.attrs = attrs;

        this.render = function(){
            //var dataName = this.attrs.name.split(',')[0].trim().replace(/\s/g, '').toLowerCase();
            var name = createElem('span',
                    {'data-id': this.attrs.id},
                    this.attrs.name
            );
            var temp = createElem('span', {}, this.attrs.temp + '&deg;');
            var loc = createElem('div', {class: 'location'});
            loc.appendChild(name);
            loc.appendChild(temp);
            return loc;
        };
    };

    var LocationSpinner = function(attrs){
        this.atts = attrs;
        this.render = function(){
            return createElem('div',
                {id: 'location-spinner', class: 'spinner', style: 'display: block;'},
                '<div></div><div></div><div></div>'
            );
        };
    };


    return{
        Current: Current,
        Period: Period,
        Today: Today,
        Day: Day,
        Forecast: Forecast,
        Location: Location,
        LocationSpinner: LocationSpinner
    };

})();

// functions used by other functions to make things easier
var helpers = (function(){

    // makes an ajax call to url with method and runs appropriate callback
    var ajax = function(url, method, success, error){
        var r = new XMLHttpRequest();
        r.open(method, url, true);

        r.onload = function(){
            if(this.status >= 200 && this.status < 400){
                success(this); // success!
            }else{
                error(this);// reached server but error
            }
        };

        r.onerror = function(){
            error(this);// connection error of some sort
        };

        r.send();
    };

    // checks whether all elements in array arr are true
    var arrayAllTrue = function(arr){
        var arrLength = arr.length;
        for(var i=0; i < arrLength; i++)
            if(!arr[i]) return false;
        return true;
    };

    // checks whether the cache is older than EXPIRY_TIME
    var cacheExpired = function(setAt){
        var EXPIRY_TIME = 30 * (60 * 1000); // min to milliseconds
        return (Date.now() - setAt) > EXPIRY_TIME;
    };

    // converts K to C or F if units is imperial
    var convertTemp = function(temp, units){
        temp = temp - 273.15;
        if(units == 'imperial')
            temp = temp * (9.0/5) + 32;
        return Math.round(temp);
    };

    var convertLength = function(len, units){
        if(units == 'imperial')
            len = len*0.039370;
        return len;
    };

    return {
        ajax: ajax,
        arrayAllTrue: arrayAllTrue,
        cacheExpired: cacheExpired,
        convertTemp: convertTemp,
        convertLength: convertLength
    };

})();

// The main functions of the code. Returns init() to init/refresh the data
// requires components and helpers
var main = (function(){

    // flow goes from init -> getData -> parseData -> renderData

    // renders the data and adds elements to the popup
    var renderData = function(data){
        // create elements
        var current = new components.Current(data.current);
        var today = new components.Today({today: data.today});
        var forecast = new components.Forecast({days: data.forecast});

        // display data
        var main = document.getElementById('main');
        main.innerHTML = '';
        main.appendChild(current.render());
        main.appendChild(document.createElement('hr'));
        main.appendChild(today.render());
        main.appendChild(document.createElement('hr'));
        main.appendChild(forecast.render());

        // hide no location warning
        document.getElementById('no-location').style.display = 'none';
    };

    // used to parse the data
    var parseData = function(data, callback){
        chrome.storage.sync.get('units', function(result){

            var units = result.units || 'metric';
            var weekdays = ['Sunday', 'Monday', 'Tuesday', 'Wednesday',
                            'Thursday', 'Friday', 'Saturday'];
            var months = ['January', 'February', 'March', 'April', 'May', 'June', 'July',
                          'August', 'September', 'October', 'November', 'December'];

            var currentData = {
                img: 'icons/' + data[0].weather[0].icon.substr(0, 2) + '.png',
                temp: helpers.convertTemp(data[0].main.temp, units),
                desc: data[0].weather[0].main
            };

            var todayData = [];
            var i, date;
            for(i=0; i < 5; i++){
                // get time
                date = new Date(data[1].list[i].dt*1000); // ms
                var hours = '0' + date.getHours();
                hours = hours.substr(hours.length - 2); // pad to 2 digits
                var minutes = '0' + date.getMinutes();
                minutes = minutes.substr(minutes.length - 2); // pad again

                // get precipitation
                var precip = 0;
                if(data[1].list[i].rain)
                    precip = +data[1].list[i].rain['3h'] || 0;
                else if(data[1].list[i].snow)
                    precip = +data[1].list[i].snow['3h'] || 0;
                precip = helpers.convertLength(precip, units).toFixed(2);
                length_unit = units == 'imperial' ? 'in' : 'mm';

                // store data in array
                todayData.push({
                    img: 'icons/' + data[1].list[i].weather[0].icon.substr(0, 2) + '.png',
                    temp: helpers.convertTemp(data[1].list[i].main.temp, units),
                    precip: precip,
                    length_unit: length_unit,
                    time: hours + ':' + minutes
                });
            }

            var forecastData = [];
            for(i=0; i < 5; i++){
                date = new Date(data[2].list[i].dt*1000); // ms
                forecastData.push({
                    img: 'icons/' + data[2].list[i].weather[0].icon.substr(0, 2) + '.png',
                    temp: helpers.convertTemp(data[2].list[i].temp.max, units),
                    desc: data[2].list[i].weather[0].main,
                    weekday: weekdays[date.getDay()],
                    month: months[date.getMonth()] + ' ' + date.getDate()
                });
            }

            callback({current: currentData, today: todayData, forecast: forecastData});

        });
    };

    // gets data and gives arr to callback if it is full
    var getData = function(key, url, arr, ind, callback){
        chrome.storage.local.get(key, function(data){
            if(data[key] && !helpers.cacheExpired( JSON.parse(data[key]).setAt )){
                arr[ind] = JSON.parse(data[key]);
                if(helpers.arrayAllTrue(arr))
                    callback(arr);
            }else{
                var spinner = document.getElementById('spinner');
                spinner.style.display = 'block';
                helpers.ajax(url, 'GET',
                    function(r){
                        var data = JSON.parse(r.response);
                        arr[ind] = data;

                        // cache with time of cache
                        var toStore = {};
                        data.setAt = Date.now();
                        toStore[key] = JSON.stringify(data);
                        chrome.storage.local.set(toStore);

                        if(helpers.arrayAllTrue(arr)){
                            callback(arr);
                            spinner.style.display = 'none';
                            document.getElementById('error-message').style.display = 'none';
                        }
                    },
                    function(){
                        console.log('error');
                        spinner.style.display = 'none';
                        document.getElementById('error-message').style.display = 'block';
                    }
                );
            }
        });
    };

    // start the process of getting data and rendering
    var init = function(){
        chrome.storage.sync.get('loc', function(data){
            // get the location
            data = data.loc && JSON.parse(data.loc);

            // should show the menu and to choose a location if
            // there is nothing stored. Then return
            if(!(data && data.id && data.name)){
                document.getElementById('sidebar').style.display = 'block';
                document.getElementById('no-location').style.display = 'block';
                return;
            }

            var LOCATION = {
                id: (data.id),
                name: (data.name)
            };

            // make sure all 3 calls happen with getData before rendering
            var weatherData = [null, null, null];
            var parseAndRender = function(arr){
                parseData(arr, renderData);
            };
            getData('currentWeatherData', 'http://api.openweathermap.org/data/2.5/weather?id=' + LOCATION.id + '&APPID=1ef0ce4e8b21c0a827f07386ab22a757', weatherData, 0, parseAndRender);
            getData('todayWeatherData', 'http://api.openweathermap.org/data/2.5/forecast?id=' + LOCATION.id + '&APPID=1ef0ce4e8b21c0a827f07386ab22a757', weatherData, 1, parseAndRender);
            getData('forecastWeatherData', 'http://api.openweathermap.org/data/2.5/forecast/daily?id=' + LOCATION.id + '&APPID=1ef0ce4e8b21c0a827f07386ab22a757', weatherData, 2, parseAndRender);

            // update the location text
            document.getElementById('location').innerText = LOCATION.name.substr(0, 1).toUpperCase() + LOCATION.name.substr(1);
        });

        // set the units buttons
        chrome.storage.sync.get('units', function(result){
            var units = result.units || 'metric';
            // set the units button
            var unitsBtns = document.getElementsByClassName('units-btn');
            var unitBtnsLength = unitsBtns.length;
            for(var i=0; i < unitBtnsLength; i++){
                if(unitsBtns[i].dataset.units == units) unitsBtns[i].setAttribute('class', 'units-btn active');
                else unitsBtns[i].setAttribute('class', 'units-btn');
            }
        });
    };

    return {
        init: init
    };

})();

// the user interactions
// requires components, helpers, and main
var interactions = (function(){

    var toggleSidebar = function(){
        var sidebar = document.getElementById('sidebar');
        if(sidebar.style.display === 'block') sidebar.style.display = 'none';
        else sidebar.style.display = 'block';
    };
    // refresh data
    var refresh = function(){
        chrome.storage.local.clear(); // clear cache
        main.init(); // re render the data
    };
    // change the units to the data attr on the button
    var changeUnits = function(e, btnInd, btnArr){
        chrome.storage.sync.set({'units': e.target.dataset.units});
        var arrLength = btnArr.length;
        for(var i=0; i < arrLength; i++)
            btnArr[i].setAttribute('class', 'units-btn');
        btnArr[btnInd].setAttribute('class', 'units-btn active');
        refresh();
    };
    // set the current location based on data id of event target
    var setLocation = function(e){
        var id = e.target.dataset.id;

        // get dictionary of names
        chrome.storage.local.get('locNames', function(data){
            if(!(data && data.locNames)) return; // error of some sort

            var name = JSON.parse(data.locNames)[id];

            chrome.storage.sync.set({loc: JSON.stringify({name: name, id:id})}, function(data){
                refresh(); // refresh data and re-render
                toggleSidebar(); // close sidebar

                // remove list of search results
                var locations = document.getElementById('locations');
                locations.innerHTML = '';

                // clear input text
                document.getElementById('location-input').value = '';

                // remove id, name map from storage
                chrome.storage.local.remove('locNames');
            });
        });
    };
    // search for locations
    var search = function(e){
        var locations = document.getElementById('locations');
        locations.innerHTML = '';
        locations.appendChild(new components.LocationSpinner().render());

        var loc = document.getElementById('location-input').value;

        helpers.ajax(
            'http://api.openweathermap.org/data/2.5/find?&q=' + loc +
            '&type=like&sort=population&APPID=1ef0ce4e8b21c0a827f07386ab22a757',
            'GET',
            function(r){

                chrome.storage.sync.get('units', function(result){
                    var units = result.units || 'metric';
                    var data = JSON.parse(r.response);

                    // used as key value to map id to names when id chosen
                    // basically passes data to setLocation
                    var locNames = {};

                    locations.innerHTML = ''; // clear any old entries
                    var loc = new components.Location();
                    data.list.map(function(elem){
                        var name = elem.name + ', ' + elem.sys.country;
                        var id = elem.id;
                        var temp = helpers.convertTemp(elem.main.temp, units);

                        loc.attrs = {name: name, id: id, temp: temp};
                        var locationElem = loc.render();

                        // click on place name
                        locationElem.children[0].onclick = setLocation;

                        locations.appendChild(locationElem);

                        locNames[elem.id] = elem.name;
                    });

                    chrome.storage.local.set({locNames: JSON.stringify(locNames)});
                });

            },
            function(r){
                console.log('error');
                locations.innerHTML = '';
                var errorMessage = document.createElement('p');
                errorMessage.setAttribute('id', 'locations-error');
                errorMessage.innerText = 'Unable to search for locations.';
                locations.appendChild(errorMessage);
            }
        );
    };
    // prevents propagation of the event
    // NOTE: generally bad practice to stop an event as other things
    // might rely on it. This is a pretty small application though
    // without a lot of logic so we'll use on the menu
    var stopPropEvent = function(e){
        e.stopPropagation();
    };
    // close menu (sidebar) if it is open
    var closeMenu = function(e){
        var sidebar = document.getElementById('sidebar');
        if(sidebar.style.display === 'block') sidebar.style.display = 'none';
    };

    // Attach event listeners
    document.getElementById('menu-icon').onclick = toggleSidebar;
    document.getElementById('refresh').onclick = refresh;
    document.getElementById('search').onclick = search;
    document.getElementById('menu').onclick = stopPropEvent; // stop closing of menu if click it
    document.getElementById('main').onclick = closeMenu; // close menu if click outside it
    document.getElementById('location-input').onkeypress = function(e){
        if(e.keyCode == 13) search(e);
    };
    var unitsBtns = document.getElementsByClassName('units-btn');
    Array.prototype.forEach.call(unitsBtns, function(elem, ind, arr){
        elem.onclick = function(e){
            changeUnits(e, ind, arr);
        };
    });

    return;

})();

main.init();

/*
var todayData = [
    {time: '10:00', img: 'sun.png', temp: '15', precip: 0},
    {time: '13:00', img: 'sun.png', temp: '16', precip: 0},
    {time: '16:00', img: 'sun.png', temp: '19', precip: 0},
    {time: '19:00', img: 'sun.png', temp: '14', precip: 0},
    {time: '21:00', img: 'sun.png', temp: '11', precip: 0},
];

var forecastData = [
    {img: 'sun.png', temp: '14', desc: 'Sunny', weekday: 'Monday', month: 'January 19'},
    {img: 'sun.png', temp: '18', desc: 'Sunny', weekday: 'Monday', month: 'January 19'},
    {img: 'sun.png', temp: '12', desc: 'Sunny', weekday: 'Monday', month: 'January 19'},
    {img: 'sun.png', temp: '9', desc: 'Sunny', weekday: 'Monday', month: 'January 19'},
    {img: 'sun.png', temp: '13', desc: 'Sunny', weekday: 'Monday', month: 'January 19'}
];
*/

