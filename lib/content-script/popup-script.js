/**
 * This file is part of AdBlock Ultimate Browser Extension
 *
 * AdBlock Ultimate Browser Extension is free software: you can redistribute it and/or modify
 * it serves under the terms of the GNU Lesser General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * AdBlock Ultimate Browser Extension is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU Lesser General Public License for more details.
 *
 * You should have received a copy of the GNU Lesser General Public License
 * along with AdBlock Ultimate Browser Extension.  If not, see <http://www.gnu.org/licenses/>.
 */
(function () {
	var backgroundPage = chrome.extension.getBackgroundPage();
	window.ext = {
		__proto__: backgroundPage.ext,
		closePopup: function () {
			window.close();
		},
		resizePopup: function () {

		}
	};
	window.BrowserTabs = backgroundPage.BrowserTabs;

	window.i18n = chrome.i18n;

	$(window).on('unload', function () {
		if (window.tab) {
			UI.updateTabIconAndContextMenu(tab, true);
		}
	});
})();
