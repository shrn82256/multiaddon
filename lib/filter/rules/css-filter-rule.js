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

/**
 * Initializing required libraries for this file.
 * require method is overridden in Chrome extension (port/require.js).
 */
var StringUtils = require('../../../lib/utils/common').StringUtils;
var FilterRule = require('../../../lib/filter/rules/base-filter-rule').FilterRule;
var Utils = require('../../../lib/utils/browser-utils').Utils;

var isShadowDomSupported = Utils.isShadowDomSupported();

var CssFilterRule = exports.CssFilterRule = function (rule, filterId) {

	FilterRule.call(this, rule, filterId);

	var isInjectRule = StringUtils.contains(rule, FilterRule.MASK_CSS_INJECT_RULE) || StringUtils.contains(rule, FilterRule.MASK_CSS_EXCEPTION_INJECT_RULE);
	if (isInjectRule) {
		this.isInjectRule = isInjectRule;
	}

	var mask;
	if (isInjectRule) {
		this.whiteListRule = StringUtils.contains(rule, FilterRule.MASK_CSS_EXCEPTION_INJECT_RULE);
		mask = this.whiteListRule ? FilterRule.MASK_CSS_EXCEPTION_INJECT_RULE : FilterRule.MASK_CSS_INJECT_RULE;
	} else {
		this.whiteListRule = StringUtils.contains(rule, FilterRule.MASK_CSS_EXCEPTION_RULE);
		mask = this.whiteListRule ? FilterRule.MASK_CSS_EXCEPTION_RULE : FilterRule.MASK_CSS_RULE;
	}

	var indexOfMask = rule.indexOf(mask);
	if (indexOfMask > 0) {
		// domains are specified, parsing
		var domains = rule.substring(0, indexOfMask);
		this.loadDomains(domains);
	}
    
    this.cssSelector = rule.substring(indexOfMask + mask.length);
    if (isShadowDomSupported) {
	   this.cssSelector = "::content " + this.cssSelector;        
    }
};

CssFilterRule.prototype = Object.create(FilterRule.prototype);