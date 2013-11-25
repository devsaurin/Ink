/**
 * @module Ink.UI.DatePicker_1
 * @author inkdev AT sapo.pt
 * @version 1
 */
Ink.createModule('Ink.UI.DatePicker', '1', ['Ink.UI.Common_1','Ink.Dom.Event_1','Ink.Dom.Css_1','Ink.Dom.Element_1','Ink.Dom.Selector_1','Ink.Util.Array_1','Ink.Util.Date_1', 'Ink.Dom.Browser_1'], function(Common, Event, Css, Element, Selector, InkArray, InkDate ) {
    'use strict';

    // Repeat a string. Long version of (new Array(n)).join(str);
    function strRepeat(n, str) {
        var ret = '';
        for (var i = 0; i < n; i++) {
            ret += str;
        }
        return ret;
    }

    /**
     * @class Ink.UI.DatePicker
     * @constructor
     * @version 1
     *
     * @param {String|DOMElement} selector
     * @param {Object} [options] Options
     *      @param {Boolean}   [options.autoOpen=false]  set to `true` to automatically open the datepicker.
     *      @param {String}    [options.cleanText]       text to display on clean button. defaults to 'Limpar'
     *      @param {String}    [options.closeText]       text to display on close button. defaults to 'Fechar'
     *      @param {String}    [options.cssClass]        CSS class to be applied to the datepicker
     *      @param {String}    [options.dateRange]       enforce limits to year, month and day for the Date, ex: '1990-08-25:2020-11'
     *      @param {Boolean}   [options.displayInSelect] whether to display the component in a select. defaults to false.
     *      @param {String|DOMElement} [options.dayField]   (if using options.displayInSelect) `<select>` field with days.
     *      @param {String|DOMElement} [options.monthField] (if using options.displayInSelect)  `<select>` field with months.
     *      @param {String|DOMElement} [options.yearField]  (if using options.displayInSelect)  `<select>` field with years.
     *      @param {String}    [options.format]          Date format string
     *      @param {String}    [options.instance]        unique id for the datepicker
     *      @param {Object}    [options.month]           Hash of month names. Defaults to portuguese month names. January is 1.
     *      @param {String}    [options.nextLinkText]    text to display on the previous button. defaults to '«'
     *      @param {String}    [options.ofText]          text to display between month and year. defaults to ' de '
     *      @param {Boolean}   [options.onFocus=true]    if the datepicker should open when the target element is focused
     *      @param {Function}  [options.onMonthSelected] callback function to execute when the month is selected
     *      @param {Function}  [options.onSetDate]       callback to execute when set date
     *      @param {Function}  [options.onYearSelected]  callback function to execute when the year is selected
     *      @param {String}    [options.position]        position the datepicker. Accept right or bottom, default is right
     *      @param {String}    [options.prevLinkText]    text to display on the previous button. defaults to '«'
     *      @param {Boolean}   [options.showClean]       whether to display the clean button or not. defaults to true.
     *      @param {Boolean}   [options.showClose]       whether to display the close button or not. defaults to true.
     *      @param {Boolean}   [options.shy=true]        whether the datepicker starts automatically.
     *      @param {String}    [options.startDate]       Date to define init month. Must be in yyyy-mm-dd format
     *      @param {Number}    [options.startWeekDay]    day to use as first column on the calendar view. Defaults to Monday (1)
     *      @param {Function}  [options.validDayFn]      callback function to execute when 'rendering' the day (in the month view)
     *      @param {Object}    [options.wDay]            Hash of weekdays. Defaults to portuguese month names. Sunday is 0.
     *      @param {String}    [options.yearRange]       enforce limits to year for the Date, ex: '1990:2020' (deprecated)
     *
     * @example
     *     <input type="text" id="dPicker" />
     *     <script>
     *         Ink.requireModules(['Ink.Dom.Selector_1','Ink.UI.DatePicker_1'],function( Selector, DatePicker ){
     *             var datePickerElement = Ink.s('#dPicker');
     *             var datePickerObj = new DatePicker( datePickerElement );
     *         });
     *     </script>
     */
    var DatePicker = function(selector, options) {
        if (selector) {
            this._dataField = Common.elOrSelector(selector, '[Ink.UI.DatePicker_1]: selector argument');
        }

        this._options = Common.options('Ink.UI.DatePicker_1', {
            autoOpen:        ['Boolean', false],
            cleanText:       ['String', 'Clear'],
            closeText:       ['String', 'Close'],
            containerElement:['Element', null],
            cssClass:        ['String', 'sapo_component_datepicker'],
            dateRange:       ['String', null],
            
            // use this in a <select>
            displayInSelect: ['Boolean', false],
            dayField:        ['Element', null],
            monthField:      ['Element', null],
            yearField:       ['Element', null],

            format:          ['String', 'yyyy-mm-dd'],
            instance:        ['String', 'scdp_' + Math.round(99999*Math.random())],
            nextLinkText:    ['String', '»'],
            ofText:          ['String', '&nbsp;de&nbsp;'],
            onFocus:         ['Boolean', true],
            onMonthSelected: ['Function', null],
            onSetDate:       ['Function', null],
            onYearSelected:  ['Function', null],
            position:        ['String', 'right'],
            prevLinkText:    ['String', '«'],
            showClean:       ['Boolean', true],
            showClose:       ['Boolean', true],
            shy:             ['Boolean', true],
            startDate:       ['String', null], // format yyyy-mm-dd,
            startWeekDay:    ['Number', 1],
            validDayFn:      ['Function', null],
            yearRange:       ['String', null],
            month: ['Object', {
                 1:'January',
                 2:'February',
                 3:'March',
                 4:'April',
                 5:'May',
                 6:'June',
                 7:'July',
                 8:'August',
                 9:'September',
                10:'October',
                11:'November',
                12:'December'
            }],
            wDay: ['Object', {
                0:'Sunday',
                1:'Monday',
                2:'Tuesday',
                3:'Wednesday',
                4:'Thursday',
                5:'Friday',
                6:'Saturday'
            }]
        }, options || {}, this._dataField);

        this._options.format = this._dateParsers[ this._options.format ] || this._options.format;

        this._hoverPicker = false;

        this._picker = this._options.pickerField &&
            Common.elOrSelector(this._options.pickerField, 'pickerField');

        this._today = new Date();
        this._day   = this._today.getDate( );
        this._month = this._today.getMonth( );
        this._year  = this._today.getFullYear( );

        this._setMinMax( this._options.dateRange || this._options.yearRange );
        this._data = new Date( Date.UTC.apply( this , this._checkDateRange( this._year , this._month , this._day ) ) );

        if(this._options.startDate && /\d\d\d\d\-\d\d\-\d\d/.test(this._options.startDate)) {
            this.setDate( this._options.startDate );
        }

        if(this._options.displayInSelect &&
                !(this._options.dayField && this._options.monthField && this._options.yearField)){
            throw new Error(
                'Ink.UI.DatePicker: displayInSelect option enabled.'+
                'Please specify dayField, monthField and yearField selectors.');
        }

        if ( !this._options.startDate ){
            if( this._dataField && typeof this._dataField.value === 'string' && this._dataField.value){
                this.setDate( this._dataField.value );
            }
        }

        this._init();
    };

    DatePicker.prototype = {
        version: '0.1',

        /**
         * Initialization function. Called by the constructor and
         * receives the same parameters.
         *
         * @method _init
         * @private
         */
        _init: function(){
            Ink.extendObj(this._options,this._lang || {});

            this._render();
            this._listenToContainerObjectEvents();

            Common.registerInstance(this, this._containerObject, 'datePicker');
        },

        /**
         * Renders the DatePicker's markup
         *
         * @method _render
         * @private
         */
        _render: function() {
            this._containerObject = document.createElement('div');

            this._containerObject.id = this._options.instance;

            this._containerObject.className = 'sapo_component_datepicker';

            this._renderSuperTopBar();

            var calendarTop = document.createElement("div");
            calendarTop.className = 'sapo_cal_top';

            this._monthDescContainer = document.createElement("div");
            this._monthDescContainer.className = 'sapo_cal_month_desc';

            this._monthPrev = document.createElement('div');
            this._monthPrev.className = 'sapo_cal_prev';
            this._monthPrev.innerHTML ='<a href="#prev" class="change_month_prev">' + this._options.prevLinkText + '</a>';

            this._monthNext = document.createElement('div');
            this._monthNext.className = 'sapo_cal_next';
            this._monthNext.innerHTML ='<a href="#next" class="change_month_next">' + this._options.nextLinkText + '</a>';

            calendarTop.appendChild(this._monthPrev);
            calendarTop.appendChild(this._monthDescContainer);
            calendarTop.appendChild(this._monthNext);

            this._monthContainer = document.createElement("div");
            this._monthContainer.className = 'sapo_cal_month';

            this._containerObject.appendChild(calendarTop);
            this._containerObject.appendChild(this._monthContainer);

            this._monthSelector = this._renderMonthSelector();
            this._containerObject.appendChild(this._monthSelector);

            this._yearSelector = document.createElement('ul');
            this._yearSelector.className = 'sapo_cal_year_selector';

            this._containerObject.appendChild(this._yearSelector);

            if(!this._options.onFocus || this._options.displayInSelect){
                if(!this._options.pickerField){
                    this._picker = document.createElement('a');
                    this._picker.href = '#open_cal';
                    this._picker.innerHTML = 'open';
                    this._picker.style.position = 'absolute';
                    this._picker.style.top = Element.elementTop(this._dataField);
                    this._picker.style.left = Element.elementLeft(this._dataField) + (Element.elementWidth(this._dataField) || 0) + 5 + 'px';
                    this._dataField.parentNode.appendChild(this._picker);
                    this._picker.className = 'sapo_cal_date_picker';
                } else {
                    this._picker = Common.elOrSelector(this._options.pickerField, 'pickerField');
                }
            }

			this._appendDatePickerToDom();

            this._renderMonth();

            this._monthChanger = document.createElement('a');
            this._monthChanger.href = '#monthchanger';
            this._monthChanger.className = 'sapo_cal_link_month';
            this._monthChanger.innerHTML = this._options.month[this._month + 1];

            this._deText = document.createElement('span');
            this._deText.innerHTML = this._options._deText;

            this._yearChanger = document.createElement('a');
            this._yearChanger.href = '#yearchanger';
            this._yearChanger.className = 'sapo_cal_link_year';
            this._yearChanger.innerHTML = this._year;
            this._monthDescContainer.innerHTML = '';
            this._monthDescContainer.appendChild(this._monthChanger);
            this._monthDescContainer.appendChild(this._deText);
            this._monthDescContainer.appendChild(this._yearChanger);

            // this._dataField.parentNode.appendChild(this._containerObject, dom.childNodes[0]);

            if (!this._picker) {
                Event.observe(this._dataField,'focus',Ink.bindEvent(function(){
                    this._containerObject = Element.clonePosition(this._containerObject, this._dataField);

                    var top;
                    var left;

                    var rect = this._dataField.getBoundingClientRect();
                    if ( this._options.position === 'bottom' ) {
                        top = rect.bottom;
                        left = rect.left;
                    } else {
                        top = rect.top;
                        left = rect.right;
                    }
                    top += Element.scrollHeight();
                    left += Element.scrollWidth();

                    this._containerObject.style.top = top + 'px';
                    this._containerObject.style.left = left + 'px';
                    //dom.appendChild(this._containerObject);
                    this._updateDate();
                    this._renderMonth();
                    this._containerObject.style.display = 'block';
                },this));
            }
            else {
                Event.observe(this._picker,'click',Ink.bindEvent(function(e){
                    Event.stop(e);
                    this._containerObject = Element.clonePosition(this._containerObject, this._picker);
                    this._updateDate();
                    this._renderMonth();
                    this._containerObject.style.display = 'block';
                },this));
            }
            if (this._options.autoOpen) {
                this._containerObject = Element.clonePosition(this._containerObject, (this._picker || this._dataField));
                this._updateDate();
                this._renderMonth();
                this._containerObject.style.display = 'block';
            }

            if(!this._options.displayInSelect){
                Event.observe(this._dataField,'change', Ink.bindEvent(function() {
                    this._updateDate( );
                    this._showDefaultView( );
                    this.setDate( );
                    if ( !this._hoverPicker ) {
                        this._hide(true);
                    }
                },this));
                Event.observe(this._dataField,'blur', Ink.bindEvent(function() {
                    if ( !this._hoverPicker ) {
                        this._hide(true);
                    }
                },this));
            } else {
                Event.observe(this._options.dayField,'change', Ink.bindEvent(function(){
                    var yearSelected = this._options.yearField[this._options.yearField.selectedIndex].value;
                    if(yearSelected !== '' && yearSelected !== 0) {
                        this._updateDate();
                        this._showDefaultView();
                    }
                },this));
                Event.observe(this._options.monthField,'change', Ink.bindEvent(function(){
                    var yearSelected = this._options.yearField[this._options.yearField.selectedIndex].value;
                    if(yearSelected !== '' && yearSelected !== 0){
                        this._updateDate();
                        this._showDefaultView();
                    }
                },this));
                Event.observe(this._options.yearField,'change', Ink.bindEvent(function(){
                    this._updateDate();
                    this._showDefaultView();
                },this));
            }

            if (this._options.shy) {
                Event.observe(document,'click',Ink.bindEvent(function(e){
                    var target = e.target || e.srcElement;

                    if (!Element.descendantOf(this._containerObject, target) && target !== this._dataField) {
                        if (!this._picker) {
                            this._hide(true);
                        }
                        else if (target !== this._picker &&
                                 (!this._options.displayInSelect ||
                                  (target !== this._options.dayField && target !== this._options.monthField && target !== this._options.yearField) ) ) {
                            if (!this._options.dayField ||
                                    (!Element.descendantOf(this._options.dayField,   target) &&
                                     !Element.descendantOf(this._options.monthField, target) &&
                                     !Element.descendantOf(this._options.yearField,  target)      ) ) {
                                this._hide(true);
                            }
                        }
                    }
                },this));
            }
        },

		/**
		 * Create the markup of the view with months.
		 *
		 * @method _renderMonthSelector
		 * @private
		 */
		_renderMonthSelector: function () {
			var selector = document.createElement('ul');
            selector.className = 'sapo_cal_month_selector';

            var ulSelector = document.createElement('ul');
            var liMonth;
			var aMonth;
            for(var mon=1; mon<=12; mon++){
                liMonth = document.createElement('li');
				aMonth = document.createElement('a');
				aMonth.setAttribute('data-cal-month', mon);
				aMonth.innerHTML = this._options.month[mon].substring(0,3);
				liMonth.appendChild(aMonth);
                ulSelector.appendChild(liMonth);
                if (mon % 4 === 0) {
                    selector.appendChild(ulSelector);
					ulSelector = document.createElement('ul');
                }
            }
			return selector;
		},

		_appendDatePickerToDom: function () {
			var appendTarget = document.body;
            if(this._options.containerElement) {
                appendTarget =
					Ink.i(this._options.containerElement) ||  // small backwards compatibility thing
					Common.elOrSelector(this._options.containerElement);
            }
            appendTarget.appendChild(this._containerObject);
		},

        /**
         * Render the topmost bar with the "close" and "clear" buttons.
         */
        _renderSuperTopBar: function () {
            if((!this._options.showClose) || (!this._options.showClean)){ return; }

            this._superTopBar = document.createElement("div");
            this._superTopBar.className = 'sapo_cal_top_options';
            if(this._options.showClean){
                var clean = document.createElement('a');
                clean.className = 'clean';
                clean.innerHTML = this._options.cleanText;
                this._superTopBar.appendChild(clean);
            }
            if(this._options.showClose){
                var close = document.createElement('a');
                close.className = 'close';
                close.innerHTML = this._options.closeText;
                this._superTopBar.appendChild(close);
            }
            this._containerObject.appendChild(this._superTopBar);
        },

        _listenToContainerObjectEvents: function () {
            Event.observe(this._containerObject,'mouseover',Ink.bindEvent(function(e){
                Event.stop( e );
                this._hoverPicker = true;
            },this));

            Event.observe(this._containerObject,'mouseout',Ink.bindEvent(function(e){
                Event.stop( e );
                this._hoverPicker = false;
            },this));

            Event.observe(this._containerObject,'click',Ink.bindEvent(this._onClick, this));
        },

        _onClick: function(e){
            var elem = Event.element(e);
            var className = elem.className;
            var isActive = !Css.hasClassName(elem, 'sapo_cal_off');

            Event.stop(e);

			// Relative changers
			if (/^change_(year|month)_(next|prev)$/.test(className) && isActive) {
				return this._onRelativeChangerClick(elem);
			}

			// Absolute changers
			if(Selector.matches('[data-cal-month], [data-cal-year], [data-cal-day]', [elem]).length && isActive) {
				return this._onAbsoluteChangerClick(elem);
			}

			// Mode changers
            if (className === 'sapo_cal_link_month') {
                this._monthContainer.style.display = 'none';
                this._yearSelector.style.display = 'none';
                this._monthPrev.childNodes[0].className = 'action_inactive';
                this._monthNext.childNodes[0].className = 'action_inactive';
                this._setActiveMonth();
                this._monthSelector.style.display = 'block';
            } else if (className === 'sapo_cal_link_year') {
                this._monthPrev.childNodes[0].className = 'action_inactive';
                this._monthNext.childNodes[0].className = 'action_inactive';
                this._monthSelector.style.display = 'none';
                this._monthContainer.style.display = 'none';
                this._showYearSelector();
            } else if(className === 'clean'){
                this._clean();
            } else if(className === 'close'){
                this._hide(false);
            }

            this._updateDescription();
        },

		/**
		 * Handle click events on a changer (« ») for next/prev year/month
		 * @method _onChangerClick
		 * @private
		 **/
		_onRelativeChangerClick: function (elem) {
            var changeYear = {
                change_year_next: 1,
                change_year_prev: -1
            };
            var changeMonth = {
                change_month_next: 1,
                change_month_prev: -1
            };

			if( elem.className in changeMonth ) {
                this._updateCal(changeMonth[elem.className]);
            } else if( elem.className in changeYear ) {
                this._showYearSelector(changeYear[elem.className]);
            }
		},

		/**
		 * Handle click events on an atom-changer (day button, month button, year button)
		 *
		 * @method _onAbsoluteChangerClick
		 * @private
		 */
		_onAbsoluteChangerClick: function (elem) {
			var elemData = Element.data(elem);

			if( Number(elemData.calDay) ){
				this.setDate( [this._year, this._month + 1, elemData.calDay].join('-') );
				this._hide();
            } else if( Number(elemData.calMonth) ) {
				this._month = Number(elemData.calMonth) - 1;
				this._showDefaultView();
				this._updateCal();
            } else if( Number(elemData.calYear) ){
                this._changeYear(Number(elemData.calYear));
            }
		},

        _changeYear: function (year) {
            year = +year;
            if(year){
                this._year = year;
                if( typeof this._options.onYearSelected === 'function' ){
                    this._options.onYearSelected(this, {
                        'year': this._year
                    });
                }
                this._monthPrev.childNodes[0].className = 'action_inactive';
                this._monthNext.childNodes[0].className = 'action_inactive';
                this._yearSelector.style.display='none';
                this._setActiveMonth();
                this._monthSelector.style.display='block';
            }
        },

        _clean: function () {
            if(this._options.displayInSelect){
                this._options.yearField.selectedIndex = 0;
                this._options.monthField.selectedIndex = 0;
                this._options.dayField.selectedIndex = 0;
            } else {
                this._dataField.value = '';
            }
        },

        /**
         * Hides the DatePicker. If the component is shy (options.shy), behaves differently.
         *
         * @method _hide
         * @param [blur=true] Set to false to indicate this is not just a blur and force hiding even if the component is shy.
         */
        _hide: function(blur) {
            blur = blur === undefined ? true : blur;
            if (blur === false || (blur && this._options.shy)) {
                this._containerObject.style.display = 'none';
            }
        },

        /**
         * Sets the range of dates allowed to be selected in the Date Picker
         *
         * @method _setMinMax
         * @param {String} dateRange Two dates separated by a ':'. Example: 2013-01-01:2013-12-12
         * @private
         */
        _setMinMax : function( dateRange )
        {
            var self = this;
            function noMinLimit() {
                self._yearMin   = Number.MIN_VALUE;
                self._monthMin  = 1;
                self._dayMin    = 1;
            }
            function noMaxLimit() {
                self._yearMax   = Number.MAX_VALUE;
                self._monthMax  = 12;
                self._dayMax    = 31;
            }
            function noLimits() { noMinLimit(); noMaxLimit(); }

            if (!dateRange) { return noLimits(); }

            var dates = dateRange.split( ':' );
            var rDate = /^(\d{4})((\-)(\d{1,2})((\-)(\d{1,2}))?)?$/;

            InkArray.each([{suf: 'Min', date: dates[0]}, {suf: 'Max', date: dates[1]}], function (data) {
                if (!data.date) { return; }
                var yearLim;
                var monthLim;
                var dayLim;

                if ( data.date.toUpperCase() === 'NOW' ) {
                    yearLim   = this._today.getFullYear( );
                    monthLim  = this._today.getMonth( ) + 1;
                    dayLim    = this._today.getDate( );
                } else if ( rDate.test( data.date ) ) {
                    var splitDate = data.date.split( '-' );

                    yearLim   = Math.floor( splitDate[ 0 ] );
                    monthLim  = Math.floor( splitDate[ 1 ] ) || 1;
                    dayLim    = Math.floor( splitDate[ 2 ] ) || 1;

                    if ( 1 < monthLim && monthLim > 12 ) {
                        monthLim = 1;
                        dayLim = 1;
					}

                    if ( 1 < dayLim && dayLim > this._daysInMonth( yearLim , monthLim ) ) {
                        dayLim = 1;
                    }
                } else {
                    if (data.suf === 'Min') {
                        return noMinLimit();
                    } else {
                        return noMaxLimit();
                    }
                }

                this['_year' + data.suf] = yearLim;
                this['_month' + data.suf] = yearLim;
                this['_day' + data.suf] = dayLim;
            });

            // Invalid stuff
			var valid = this._yearMax >= this._yearMin &&
				(this._monthMax > this._monthMin ||
					( (this._monthMax === this._monthMin) && (this._dayMax >= this._dayMin) ) );
            if ( !valid )
            {
                noLimits();
            }
        },

        /**
         * Checks if a date is between the valid range.
         * Starts by checking if the date passed is valid. If not, will fallback to the 'today' date.
         * Then checks if the all params are inside of the date range specified. If not, it will fallback to the nearest valid date (either Min or Max).
         *
         * @method _checkDateRange
         * @param  {Number} year  Year with 4 digits (yyyy)
         * @param  {Number} month Month
         * @param  {Number} day   Day
         * @return {Array}       Array with the final processed date.
         * @private
         */
        _checkDateRange : function( year , month , day ) {
            if ( !this._isValidDate( year , month + 1 , day ) ) {
                year  = this._today.getFullYear( );
                month = this._today.getMonth( );
                day   = this._today.getDate( );
            }

            if ( year > this._yearMax || year === this._yearMax && month + 1 > this._monthMax ) {
                year  = this._yearMax;
                month = this._monthMax - 1;
                day   = this._dayMax;
            } else if ( year < this._yearMin || year === this._yearMax && month + 1 < this._monthMin) {
                year  = this._yearMin;
                month = this._monthMin - 1;
                day   = this._dayMin;
            }

            if ( year === this._yearMax && month + 1 === this._monthMax && day > this._dayMax ) {
				day = this._dayMax;
			} else if ( year === this._yearMin && month + 1 === this._monthMin && day < this._dayMin ) {
				day = this._dayMin;
			} else if ( day > this._daysInMonth( year , month + 1 ) ) {
				day = this._daysInMonth( year , month + 1 );
			}

            return [ year , month , day ];
        },

        /**
         * Sets the markup in the default view mode (showing the days).
         * Also disables the previous and next buttons in case they don't meet the range requirements.
         *
         * @method _showDefaultView
         * @private
         */
        _showDefaultView: function(){
            this._yearSelector.style.display = 'none';
            this._monthSelector.style.display = 'none';
            this._monthPrev.childNodes[0].className = 'change_month_prev';
            this._monthNext.childNodes[0].className = 'change_month_next';

            if ( this._year < this._yearMin || this._year === this._yearMin && this._month + 1 <= this._monthMin ){
                this._monthPrev.childNodes[0].className = 'action_inactive';
            }
            else if( this._year > this._yearMax || this._year === this._yearMax && this._month + 1 >= this._monthMax ){
                this._monthNext.childNodes[0].className = 'action_inactive';
            }

            this._monthContainer.style.display = 'block';
        },

        /**
         * Updates the date shown on the datepicker
         *
         * @method _updateDate
         * @private
         */
        _updateDate: function(){
            var dataParsed;
            if(!this._options.displayInSelect){
                if(this._dataField.value !== ''){
                    if(this._isDate(this._options.format,this._dataField.value)){
                        dataParsed = this._getDateArrayParsed(this._dataField.value);
                        dataParsed = this._checkDateRange( dataParsed[ 0 ] , dataParsed[ 1 ] - 1 , dataParsed[ 2 ] );

                        this._year  = dataParsed[ 0 ];
                        this._month = dataParsed[ 1 ];
                        this._day   = dataParsed[ 2 ];
                    }else{
                        this._dataField.value = '';
                        this._year  = this._data.getFullYear( );
                        this._month = this._data.getMonth( );
                        this._day   = this._data.getDate( );
                    }
                    this._data.setFullYear( this._year , this._month , this._day );
                    this._dataField.value = this._writeDateInFormat( );
                }
            } else {
                dataParsed = [];
                if(this._isValidDate(
                    dataParsed[0] = this._options.yearField[this._options.yearField.selectedIndex].value,
                    dataParsed[1] = this._options.monthField[this._options.monthField.selectedIndex].value,
                    dataParsed[2] = this._options.dayField[this._options.dayField.selectedIndex].value
                )){
                    dataParsed = this._checkDateRange( dataParsed[ 0 ] , dataParsed[ 1 ] - 1 , dataParsed[ 2 ] );

                    this._year  = dataParsed[ 0 ];
                    this._month = dataParsed[ 1 ];
                    this._day   = dataParsed[ 2 ];
                } else {
                    dataParsed = this._checkDateRange( dataParsed[ 0 ] , dataParsed[ 1 ] - 1 , 1 );
                    if(this._isValidDate( dataParsed[ 0 ], dataParsed[ 1 ] + 1 ,dataParsed[ 2 ] )){
                        this._year  = dataParsed[ 0 ];
                        this._month = dataParsed[ 1 ];
                        this._day   = this._daysInMonth(dataParsed[0],dataParsed[1]);

                        this.setDate();
                    }
                }
            }
            this._updateDescription();
            this._renderMonth();
        },

        /**
         * Updates the date description shown at the top of the datepicker
         *
         * @method  _updateDescription
         * @private
         */
        _updateDescription: function(){
            this._monthChanger.innerHTML = this._options.month[ this._month + 1 ];
            this._deText.innerHTML = this._options.ofText;
            this._yearChanger.innerHTML = this._year;
        },

        /**
         * Renders the year selector view of the datepicker
         *
         * @method _showYearSelector
         * @private
         */
        _showYearSelector: function(){
            if (arguments.length){
                var year = + this._year + arguments[0]*10;
                year=year-year%10;
                if ( year>this._yearMax || year+9<this._yearMin ){
                    return;
                }
                this._year = + this._year + arguments[0]*10;
            }

            var firstYear = this._year - (this._year % 10);
			var thisYear = firstYear - 1;
            var str = "<li><ul>";

			if (thisYear >= this._yearMin) {
				str += '<li><a href="#year_prev" class="change_year_prev">' + this._options.prevLinkText + '</a></li>';
			} else {
				str += '<li>&nbsp;</li>';
			}

            for (var i=1; i < 11; i++){
                if (i % 4 === 0){
                    str+='</ul><ul>';
                }

				thisYear = firstYear + i - 1;

				str += this._getYearButtonHtml(thisYear);
            }

			if( thisYear <= this._yearMax ){
				str += '<li><a href="#year_next" class="change_year_next">' + this._options.nextLinkText + '</a></li>';
			} else {
				str += '<li>&nbsp;</li>';
			}

            str += "</ul></li>";

            this._yearSelector.innerHTML = str;
			this._yearSelector.style.display = 'block';
        },

		_getYearButtonHtml: function (thisYear) {
			if ( thisYear<=this._yearMax && thisYear>=this._yearMin ){
				var className = (thisYear === this._data.getFullYear()) ? ' class="sapo_cal_on"' : '';
				return '<li><a href="#" data-cal-year="' + thisYear + '"' + className + '>' + thisYear +'</a></li>';
			} else {
				return '<li><a href="#" class="sapo_cal_off">' + thisYear +'</a></li>';

			}
		},

        /**
         * This function returns the given date in an array format
         *
         * @method _getDateArrayParsed
         * @param {String} dateStr A date on a string.
         * @private
         * @return {Array} The given date in an array format
         */
        _getDateArrayParsed: function(dateStr){
            var arrDate = [];
            var date = InkDate.set( this._options.format , dateStr );
            if (date) {
                arrDate = [ date.getFullYear( ) , date.getMonth( ) + 1 , date.getDate( ) ];
            }
            return arrDate;
        },

        /**
         * Checks if a date is valid
         *
         * @method _isValidDate
         * @param {Number} year
         * @param {Number} month
         * @param {Number} day
         * @private
         * @return {Boolean} True if the date is valid, false otherwise
         */
        _isValidDate: function(year, month, day){
            var yearRegExp = /^\d{4}$/;
            var validOneOrTwo = /^\d{1,2}$/;
            return (
                yearRegExp.test(year)     &&
                validOneOrTwo.test(month) &&
                validOneOrTwo.test(day)   &&
                month >= 1  &&
                month <= 12 &&
                day   >= 1  &&
                day   <= this._daysInMonth(year,month)
            );
        },

        /**
         * Checks if a given date is an valid format.
         *
         * @method _isDate
         * @param {String} format A date format.
         * @param {String} dateStr A date on a string.
         * @private
         * @return {Boolean} True if the given date is valid according to the given format
         */
        _isDate: function(format, dateStr){
            try {
                if (typeof format === 'undefined'){
                    return false;
                }
                var data = InkDate.set( format , dateStr );
                if( data && this._isValidDate( data.getFullYear( ) , data.getMonth( ) + 1 , data.getDate( ) ) ){
                    return true;
                }
            } catch (ex) {}

            return false;
        },

        _acceptableDay: function () {
            throw 'not implemented';
        },

        _acceptableMonth: function () {
            throw 'not implemented';
        },

        _acceptableYear: function () {
            throw 'not implemented';
        },

        /**
         * This method returns the date written with the format specified on the options
         *
         * @method _writeDateInFormat
         * @private
         * @return {String} Returns the current date of the object in the specified format
         */
        _writeDateInFormat:function(){
            return InkDate.get( this._options.format , this._data );
        },

        /**
         * This method allows the user to set the DatePicker's date on run-time.
         *
         * @method setDate
         * @param {String} dateString A date string in yyyy-mm-dd format.
         * @public
         */
        setDate : function( dateString )
        {
            if ( typeof dateString === 'string' && /\d{4}-\d{1,2}-\d{1,2}/.test( dateString ) )
            {
                var auxDate = dateString.split( '-' );
                this._year  = auxDate[ 0 ];
                this._month = auxDate[ 1 ] - 1;
                this._day   = auxDate[ 2 ];
            }

            this._setDate( );
        },

        /**
         * Sets the chosen date on the target input field
         *
         * @method _setDate
         * @param {DOMElement} objClicked Clicked object inside the DatePicker's calendar.
         * @private
         */
        _setDate : function( objClicked ) {
			if (objClicked) {
				var data = Element.data(objClicked);
				this._day = (+data.calDay) || this._day;
			}

            this._data.setFullYear.apply( this._data , this._checkDateRange( this._year , this._month , this._day ) );

            if(!this._options.displayInSelect){
                this._dataField.value = this._writeDateInFormat();
            } else {
                this._options.dayField.value   = this._data.getDate();
                this._options.monthField.value = this._data.getMonth()+1;
                this._options.yearField.value  = this._data.getFullYear();
            }

            if(this._options.onSetDate) {
                this._options.onSetDate( this , { date : this._data } );
            }
        },

        /**
         * Makes the necessary work to update the calendar
         * when choosing a different month
         *
         * @method _updateCal
         * @param {Number} inc Indicates previous or next month
         * @private
         */
        _updateCal: function(inc){
            if( typeof this._options.onMonthSelected === 'function' ){
                this._options.onMonthSelected(this, {
                    'year': this._year,
                    'month' : this._month
                });
            }
            this._updateMonth(inc);
            this._renderMonth();
        },

        /**
         * Function that returns the number of days on a given month on a given year
         *
         * @method _daysInMonth
         * @param {Number} _y - year
         * @param {Number} _m - month
         * @private
         * @return {Number} The number of days on a given month on a given year
         */
        _daysInMonth: function(_y,_m){
            var nDays = 31;

            switch (_m) {
                case 2:
                    nDays = ((_y % 400 === 0) || (_y % 4 === 0 && _y % 100 !== 0)) ? 29 : 28;
                    break;

                case 4:
                case 6:
                case 9:
                case 11:
                    nDays = 30;
                    break;
            }

            return nDays;
        },


        /**
         * Updates the calendar when a different month is chosen
         *
         * @method _updateMonth
         * @param {Number} incValue - indicates previous or next month
         * @private
         */
        _updateMonth: function(incValue){
            var mes = this._month + 1;
            var ano = this._year;
            switch(incValue){
                case -1:
                    if (mes===1){
                        if(ano === this._yearMin){ return; }
                        mes=12;
                        ano--;
                    }
                    else {
                        mes--;
                    }
                    this._year  = ano;
                    this._month = mes - 1;
                    break;
                case 1:
                    if(mes === 12){
                        if(ano === this._yearMax){ return; }
                        mes=1;
                        ano++;
                    }
                    else{
                        mes++;
                    }
                    this._year  = ano;
                    this._month = mes - 1;
                    break;
                default:
            }
        },

        /**
         * Key-value object that (for a given key) points to the correct parsing format for the DatePicker
         * @property _dateParsers
         * @type {Object}
         * @readOnly
         */
        _dateParsers: {
            'yyyy-mm-dd' : 'Y-m-d' ,
            'yyyy/mm/dd' : 'Y/m/d' ,
            'yy-mm-dd'   : 'y-m-d' ,
            'yy/mm/dd'   : 'y/m/d' ,
            'dd-mm-yyyy' : 'd-m-Y' ,
            'dd/mm/yyyy' : 'd/m/Y' ,
            'dd-mm-yy'   : 'd-m-y' ,
            'dd/mm/yy'   : 'd/m/y' ,
            'mm/dd/yyyy' : 'm/d/Y' ,
            'mm-dd-yyyy' : 'm-d-Y'
        },

        /**
         * Renders the current month
         *
         * @method _renderMonth
         * @private
         */
        _renderMonth: function(){
            var i;
            var day;
            var mes = this._month + 1;
            var ano = this._year;
            var maxDay = this._daysInMonth(ano,mes);
            
            // Week day of the first day in the month
            var wDayFirst = (new Date( ano , mes - 1 , 1 )).getDay();

            var startWeekDay = this._options.startWeekDay || 0;

            this._showDefaultView();

			if(startWeekDay > wDayFirst) {
				wDayFirst = 7 + startWeekDay - wDayFirst;
			} else {
				wDayFirst += startWeekDay;
			}

            var html = '';

            // Write the top bar of the calendar (M T W T F S S)
            html += '<ul class="sapo_cal_header">';
            var wDay;
            for(i=0; i<7; i++){
                wDay = (startWeekDay + i) % 7;
                html+='<li>' + this._options.wDay[wDay].substring(0,1)  + '</li>';
            }
            html+='</ul>';

            var counter = 0;
            html+='<ul>';

            var emptyHtml = '<li class="sapo_cal_empty">&nbsp;</li>';

            // Write the "empties". Days to add padding to the first day of the month if it is not monday.
            if(wDayFirst !== 0) {
                var empties = wDayFirst - startWeekDay - 1;
                counter += empties;
                html += strRepeat(empties, emptyHtml);
            }

            for (day = 1; day <= maxDay; day++) {
                if (counter === 7){
                    counter=0;
                    html+='<ul>';
                }

                html += this._getCalendarDayHtml(ano, mes, day);

                counter++;
                if(counter === 7){
                    html+='</ul>';
                }
            }

            // Add "empties" to the end of the calendar.
            html += strRepeat(7 - counter, emptyHtml);

            html+='</ul>';

            this._monthContainer.innerHTML = html;

        },

        /**
         * Get the HTML markup for a single day in month view, given year, month, day.
         *
         * @method _getCalendarDayHtml
         * @private
         */
        _getCalendarDayHtml: function (year, month, day) {
            var className = '';
            className += ( year === this._yearMin && month === this._monthMin && day < this._dayMin ||
                year === this._yearMax && month === this._monthMax && day > this._dayMax ||
                year === this._yearMin && month < this._monthMin ||
                year === this._yearMax && month > this._monthMax ||
                year < this._yearMin || year > this._yearMax || ( this._options.validDayFn && !this._options.validDayFn.call( this, new Date( year , month - 1 , day) ) ) ) ? " sapo_cal_off" :
                (this._data.getFullYear( ) === year && this._data.getMonth( ) === month - 1 && day === this._day) ? " sapo_cal_on" : "";
            return '<li><a href="#" class="' + className + '" data-cal-day="' + day + '">' + day + '</a></li>';   
        },

        /**
         * This method sets the active month
         *
         * @method _setActiveMonth
         * @param {DOMElement} parent DOMElement where all the months are.
         * @private
         */
        _setActiveMonth: function(parent){
            if (typeof parent === 'undefined') {
                parent = this._monthSelector;
            }

			var data = Element.data(parent);
            var length = parent.childNodes.length;

            if (+data.calMonth) {
                var year = this._year;
                var month = +data.calMonth;

                if ( year === this._data.getFullYear( ) && month === this._data.getMonth( ) + 1 ) {
                    Css.addClassName( parent , 'sapo_cal_on' );
                    Css.removeClassName( parent , 'sapo_cal_off' );
                } else {
                    Css.removeClassName( parent , 'sapo_cal_on' );
                    if ( year === this._yearMin && month < this._monthMin ||
                        year === this._yearMax && month > this._monthMax ||
                        year < this._yearMin ||
                        year > this._yearMax ) {
                        Css.addClassName( parent , 'sapo_cal_off' );
                    } else {
                        Css.removeClassName( parent , 'sapo_cal_off' );
                    }
                }
            } else if (length !== 0){
                for (var i = 0; i < length; i++) {
                    this._setActiveMonth(parent.childNodes[i]);
                }
            }
        },

        /**
         * Prototype's method to allow the 'i18n files' to change all objects' language at once.
         * @param  {Object} options Object with the texts' configuration.
         *     @param {String} closeText Text of the close anchor
         *     @param {String} cleanText Text of the clean text anchor
         *     @param {String} prevLinkText "Previous" link's text
         *     @param {String} nextLinkText "Next" link's text
         *     @param {String} ofText The text "of", present in 'May of 2013'
         *     @param {Object} month An object with keys from 1 to 12 that have the full months' names
         *     @param {Object} wDay An object with keys from 0 to 6 that have the full weekdays' names
         * @public
         */
        lang: function( options ){
            this._lang = options;
        },

        /**
         * This calls the rendering of the selected month.
         *
         * @method showMonth
         * @public
         */
        showMonth: function(){
            this._renderMonth();
        },

        /**
         * Returns true if the calendar sceen is in 'select day' mode
         * 
         * @return {Boolean} True if the calendar sceen is in 'select day' mode
         * @public
         */
        isMonthRendered: function(){
            var header = Selector.select('.sapo_cal_header',this._containerObject)[0];

            return ( (Css.getStyle(header.parentNode,'display') !== 'none') && (Css.getStyle(header.parentNode.parentNode,'display') !== 'none') );
        }
    };

    return DatePicker;

});
