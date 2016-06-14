/**
 * Datetime plugin that alters JQuery's datetimepicker
 *
 * Based on
 *
 * http://edinborough.org/Duck-Punching-jQuery-UI-Datepicker-into-a-DateTimepicker
 * http://jsfiddle.net/hLTcB/8/
 */

(function ($, undefined) {
	$.fn.datetimepicker = function (options) {
		if(typeof options == typeof '') {
			return this.datepicker.apply(this, arguments);
		}
		options = $.extend({}, options);
		options.showTime = true;
		options.constrainInput = false;
		return this.datepicker(options);
	};

	$.datepicker._defaults.clockType = 12;

	$.datepicker._getTimeText = function (inst, h, m) {
		h = h || inst.selectedHour || 0;
		m = m || inst.selectedMinute || 0;

		if (this._get(inst, 'clockType') == 12) {
			return (h == 0 || h == 12 ? '12' : h >= 12 ? h - 12 : h)
			+ ':' + (m < 10 ? '0' + m : m) + ':00' +
			+ ' ' + (h < 12 ? 'AM' : 'PM');
		}
		else {
			return (h < 10 ? '0' + h : h) + ':' + (m < 10 ? '0' + m : m) + ':00';
		}
	};

	var formatDate = $.datepicker.formatDate;
	$.datepicker.formatDate = function (format, date, settings, separator) {
		var inst = $.datepicker._curInst;
		var showTime = inst ? this._get(inst, 'showTime') : false;
		if (!separator) {
			separator = ' ';
		}
		if (showTime) {
			date.setHours(inst.selectedHour || 0);
			date.setMinutes(inst.selectedMinute || 0);
		}

		return formatDate.apply(this, arguments) + (showTime ? separator  + this._getTimeText(inst) : '');
	};

	var _updateAlternate = $.datepicker._updateAlternate;
	$.datepicker._updateAlternate = function(inst) {
		var altFormat, date, dateStr,
		altField = this._get(inst, "altField");
		if (altField) { // update alternate field too
			altFormat = this._get(inst, "altFormat") || this._get(inst, "dateFormat");
			date = this._getDate(inst);
			dateStr = this.formatDate(altFormat, date, this._getFormatConfig(inst), this._get(inst, "altFormatSeparator"));

			if (altField.attr("data-basetype") === 'datetime') { // IF DATETIME ADD TIMEZONE OFFSET
				if (!/T\d{2}:\d{2}:\d{2}/.test(dateStr)) { // missing time
					dateStr = dateStr + "T" + getTimeStrFromDate(new Date(Date.now())); // put the current time
				}

				var getOffset = function(date) {
					var pad = function(number, length){
						var str = "" + number;
						while (str.length < length) {
							str = '0' + str;
						}
						return str;
					};

					var offset = date.getTimezoneOffset();
					offset = (
						(offset < 0 ? '+':'-') + // Note the reversed sign!
						pad(parseInt(Math.abs(offset/60)), 2) +
						pad(Math.abs(offset % 60), 2)
					);

					return offset.replace(/(\d{2})$/, ":$1");
				};

				dateStr = dateStr + getOffset(date);
			}

			$(altField).each(function() { $(this).val(dateStr); }).trigger('blur');
		}
	};

	var getTimeStrFromDate = function(date) {
		return date.toTimeString().split(" ")[0];
	};

	var _setDate = $.datepicker._setDate;
	$.datepicker._setDate = function(inst, date, noChange) {
		date = new Date(date);
		_setDate.apply(this, arguments);

		var altField = this._get(inst, "altField");
		var inputCurrentVal = inst.input.val();
		if (altField && altField.attr("data-basetype") === 'datetime' && !/\s\d{2}:\d{2}:\d{2}/.test(inputCurrentVal)) {
			inst.input.val(inputCurrentVal + " " + getTimeStrFromDate(date));
		}
	};

	var _hideDatepicker = $.datepicker._hideDatepicker;
	$.datepicker._hideDatepicker = /* overrides */function () {
		var inst = $.datepicker._curInst;
		inst.selectedHour = inst.currentHour = inst.selectedMinute = inst.currentMinute = undefined;
		_hideDatepicker.apply(this, arguments);
	};

	var _getDate = $.datepicker._getDate;
	$.datepicker._getDate = /* overrides */function (inst) {
		var date = _getDate.apply(this, arguments);

		if (date) {
			date.setHours(inst.selectedHour || inst.currentHour);
			date.setMinutes(inst.selectedMinute || inst.currentMinute);
		}

		if (!date || isNaN(date.getTime())) {
			date = new Date(Date.now());
		}

		return date;
	};

	var parseDate = $.datepicker.parseDate;
	var rxTime = /\s+([0-9]+)(\:[0-9]+){0,1}(\:[0-9]+){0,1}(\s*[apm]+){0,1}/i;
	$.datepicker.parseDate = function (format, value, settings) {
		var h = 0, m = 0;

		var time = value.match(rxTime);
		if ($.isArray(time)) {
			h = parseFloat(time[1]);
			m = parseFloat((time[2] || '').replace(':', ''));
			if (isNaN(h)){h = 0;}
			if (isNaN(m)){m = 0;}

			if ((settings.clockType || $.datepicker._defaults.clockType) == 12) {
				if (h == 12){h = 0;}
				if (time[0].toLowerCase().indexOf('p') > -1){h += 12;}
			}

			value = value.replace(time[0], '');
		}

		var val = parseDate.apply(this, arguments);
		val.setHours(h);
		val.setMinutes(m);

		return val;
	};

	$.datepicker._setDateFromField = /* overrides */function (inst, noDefault) {
		if (inst.input.val() == inst.lastVal) {
			return;
		}
		var dateFormat = this._get(inst, 'dateFormat');
		var dates = inst.lastVal = inst.input ? inst.input.val() : null;
		var date, defaultDate;
		date = defaultDate = this._getDefaultDate(inst);
		var settings = this._getFormatConfig(inst);
		try {
			date = this.parseDate(dateFormat, dates, settings) || defaultDate;
		} catch (event) {
			dates = (noDefault ? '' : dates);
		}
		inst.selectedDay = date.getDate();
		inst.drawMonth = inst.selectedMonth = date.getMonth();
		inst.drawYear = inst.selectedYear = date.getFullYear();
		inst.currentDay = (dates ? date.getDate() : 0);
		inst.currentMonth = (dates ? date.getMonth() : 0);
		inst.currentYear = (dates ? date.getFullYear() : 0);
		inst.currentHour = inst.selectedHour = (dates ? date.getHours() : 0);
		inst.currentMinute = inst.selectedMinute = (dates ? date.getMinutes() : 0);
		this._adjustInstDate(inst);
		this._updateDatepicker(inst);
	};

	var _updateDatepicker = $.datepicker._updateDatepicker;
	$.datepicker._updateDatepicker = /* overrides */function (inst) {
		var showTime = this._get(inst, 'showTime');
		var buttons = this._get(inst, 'buttons');

		var self = this;

		if (buttons){inst.settings['showButtonPanel'] = true;}

		_updateDatepicker.apply(this, arguments);

		inst.dpDiv.css({ zIndex: 1000, width: "auto" });
		if (buttons) {
			var panel = inst.dpDiv.find('.ui-datepicker-buttonpane:first').html('');

			for (var i in buttons) {
				var button = $('<button class="ui-datepicker-current ui-state-default ui-priority-secondary ui-corner-all"/>');

				(function (func) {
					if (typeof func == 'object') {
						if (func.attr){button.attr(func.attr);}
						if (func.css){button.css(func.css);}
						func = func.click || function () { };
					}
					button.text(i).click(function () { func.apply(self, ['#' + inst.id, inst]); }).appendTo(panel);
				})(buttons[i]);
			}
		}

		if (showTime) {
			var table = inst.dpDiv.find('table:last');
			var thead = table.find('thead>tr:first');
			var tbody = table.find('tbody>tr:first');
			var numRows = tbody.parent().children('tr').length;

			var lblTime = $('<th colspan="2" style="white-space:nowrap">12:00 AM</th>').prependTo(thead);
			lblTime.width(lblTime.width());
			var dpwidth = inst.dpDiv.width();
			inst.dpDiv.width(dpwidth + lblTime.width());
			var groups = inst.dpDiv.find('.ui-datepicker-group');
			groups.width(dpwidth/groups.length);
			groups.eq(groups.length-1).width(dpwidth/groups.length+lblTime.width());

			var height = table.height() - table.find('td:first').height() * 2;
			var tdMin = $('<td/>').css({ height: height, marginTop: 10 }).attr('rowspan', numRows).prependTo(tbody);
			var tdHour = $('<td/>').css({ height: height, marginTop: 10, paddingLeft: 20 }).attr('rowspan', numRows).prependTo(tbody);

			if ("slider" == "slsls") {
				var divHour = $('<div/>').appendTo(tdHour);
				var divMin = $('<div/>').appendTo(tdMin);

				inst.selectedHour = inst.selectedHour || inst.currentHour;
				inst.selectedMinute = inst.selectedMinute || inst.currentMinute;
				lblTime.text($.datepicker._getTimeText(inst));

				divHour.slider({ min: 0, max: 23, value: inst.selectedHour, orientation: 'vertical', slide: function (e, ui) {
					inst.selectedHour = ui.value;
					if (inst.input) {
						inst.input.val($.datepicker._formatDate(inst));
						$.datepicker._updateAlternate(inst);
					}
					lblTime.text($.datepicker._getTimeText(inst));
				}
				});
				divMin.slider({ min: 0, max: 59, value: inst.selectedMinute, orientation: 'vertical', slide: function (e, ui) {
					inst.selectedMinute = ui.value;
					if (inst.input) {
						inst.input.val($.datepicker._formatDate(inst));
						$.datepicker._updateAlternate(inst);
					}
					lblTime.text($.datepicker._getTimeText(inst));
				}
				});
			}
			else {
				var $divHour = $('<label><select/>h</label>').appendTo(tdHour).find('select');
				var $divMin = $('<label><input type="number" value="' + inst.selectedMinute +
					'" min="0" max="59" style="width: 2em"/>m</label>')
					.appendTo(tdMin).find('input');

				inst.selectedHour = inst.selectedHour || inst.currentHour;
				inst.selectedMinute = inst.selectedMinute || inst.currentMinute;
				if (inst.settings.clockType == 12) {
					// TODO: selected
					$divHour.append(
						'<option value="0" ' + (inst.selectedHour == 0 ? "selected" : "") + '>12am</option>'
					);
					for (var i = 1; i < 12; i++) {
						$divHour.append(
							'<option value="' + i + '" ' +
							(inst.selectedHour == i ? "selected" : "") + '>' + i + '</option>'
						);
					}
					$divHour.append(
						'<option value="12" ' + (inst.selectedHour == 0 ? "selected" : "") + '>12pm</option>'
					);
					for (var i = 1; i < 12; i++) {
						$divHour.append(
							'<option value="' + (i+12) + '" ' +
							(inst.selectedHour == (i+12) ? "selected" : "") + '>' + i + '</option>'
						);
					}
				}
				else {
					for (var i = 0; i < 24; i++) {
						$divHour.append(
							'<option value="' + i + '" ' +
							(inst.selectedHour == i ? "selected" : "") +
							'>' + i + "</option>"
						);
					}
				}

				$divHour.on('change', function() {
					inst.selectedHour = $(this).val();
					lblTime.text($.datepicker._getTimeText(inst));
				});
				$divMin.on('change', function() {
					inst.selectedMinute = $(this).val();
					lblTime.text($.datepicker._getTimeText(inst));
				});
				lblTime.text($.datepicker._getTimeText(inst));
			}
		}
	};
})(jQuery);

