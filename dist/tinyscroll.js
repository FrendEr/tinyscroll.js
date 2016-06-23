/*
 + -------------------------------------------------- +
 | @name    tinyscroll.js                             |
 | @author  Frend                                     |
 | @github  https://github.com/FrendEr/tinyscroll.js  |
 + -------------------------------------------------- +
 */

;(function(root, factory) {
    if (typeof define === 'function' && define.amd) {
        define(['jquery'], function($) { return factory(); });
    } else if (typeof module !== 'undefined' && module.exports) {
        module.exports = factory();
    } else {
        window[root] = factory();
    }
}('TinyScroll', function() {

    'use strict';

    // device detect
    if (!('ontouchstart' in window)) {
        alert('Error tips: You can\'t use the tinyscroll.js because your device does not support touch events.');
    }

    // dependencies detect
    if (!$ || $ !== jQuery) {
        alert('Error tips: Tinyscroll.js is dependen on jQuery! Make use jQuery has been loaded.');
    }

    var CHILD_HEIGHT  = 30;     // px

    function TinyScroll(options) {
        this.options        = $.extend({}, options);                      // options
        this.initDate       = null;                                       // init date
        this.minDate        = null;                                       // min date
        this.maxDate        = null;                                       // max date
        this.$wrapper       = $(this.options.wrapper);                    // root element
        this.$target        = null;                                       // the target element
        this.freezing       = false;                                      // is freezing
        this.moving         = false;                                      // is moving
        this.curTopMap      = {};                                         // scroll item current top
        this.oriTopMap      = {};                                         // scroll item original top
        this.touchTime      = 0;                                          // touch start timestamp
        this.touchY         = 0;                                          // touch start point postion
        this.timeGap        = 0;                                          // time gap
        this.mTopLocked     = false;                                      // month scroll to top locked
        this.mBottomLocked  = false;                                      // month scroll to bottom locked
        this.dTopLocked     = false;                                      // day scroll to top locked
        this.dBottomLocked  = false;                                      // day scroll to bottom locked
        this.hhTopLocked    = false;                                      // hour scroll to top locked
        this.hhBottomLocked = false;                                      // hour scroll to bottom locked
        this.mmTopLocked    = false;                                      // minute scroll to top locked
        this.mmBottomLocked = false;                                      // minute scroll to bottom locked
        this.stateTree      = {                                           // state tree
            year   : this.options.year   || 0,
            month  : this.options.month  || 0,
            day    : this.options.day    || 0,
            hour   : this.options.hour   || 0,
            minute : this.options.minute || 0
        };
        this.stateCache     = {                                           // state tree cache
            year   : this.options.year   || 0,
            month  : this.options.month  || 0,
            day    : this.options.day    || 0,
            hour   : this.options.hour   || 0,
            minute : this.options.minute || 0
        };
        this.fnList         = {                                           // function list
            year   : this.yearChanged,
            month  : this.monthChanged,
            day    : this.dayChanged,
            hour   : this.hourChanged,
            minute : this.minuteChanged
        };

        this.init();
    }

    TinyScroll.prototype = {

        constructor: TinyScroll,

        /*
         * initialize app
         */
        init: function() {
            if (this.initDate < this.minDate || this.initDate > this.maxDate) {
                throw 'Error: The `initDate` is error! ' + 'Range is: [' + this.minDate + ', ' + this.maxDate + ']';
            }

            this.dateInit();
            this.render();
        },

        /*
         * render app
         */
        render: function() {
            var scope = this,
                isEqual = this.diffState(scope.stateCache, scope.stateTree);

            if (this.$wrapper.children().length !== 0) {
                this.$wrapper.find('.tiny-scroll-backdrop').show();
                this.$wrapper.find('.tiny-scroll').removeClass('slideOutDown').addClass('slideInUp');
                return;
            }

            var htmlTpl = ['<div class="tiny-scroll-backdrop"></div>',
                            '<div class="tiny-scroll slideInUp animated">',
                                (this.options.title ? '<div class="ts-header">' + this.options.title + '</div>' : ''),
                                '<div class="ts-body' + (this.options.time ? ' ts-datetime' : '') + '">',
                                    '<div class="ts-mask"></div>',
                                    '<div class="ts-col ts-col-year">',
                                        '<div class="ts-front"></div>',
                                        (this.options.needLabel ? '<em>年</em>' : ''),
                                        '<ul id="year" class="ts-item-list" data-target="year">' + this.generateList('year') + '</ul>',
                                    '</div>',
                                    '<div class="ts-col">',
                                        '<div class="ts-front"></div>',
                                        (this.options.needLabel ? '<em>月</em>' : ''),
                                        '<ul id="month" class="ts-item-list" data-target="month">' + this.generateList('month') + '</ul>',
                                    '</div>',
                                    '<div class="ts-col">',
                                        '<div class="ts-front"></div>',
                                        (this.options.needLabel ? '<em>日</em>' : ''),
                                        '<ul id="day" class="ts-item-list" data-target="day">' + this.generateList('day') + '</ul>',
                                    '</div>',
                                    (this.options.time ? (function() {
                                        return ['<div class="ts-col">',
                                                    '<div class="ts-front"></div>',
                                                    (scope.options.needLabel ? '<em>时</em>' : ''),
                                                    '<ul id="hour" class="ts-item-list" data-target="hour">' + scope.generateList('hour') + '</ul>',
                                                '</div>',
                                                '<div class="ts-col">',
                                                    '<div class="ts-front"></div>',
                                                    (scope.options.needLabel ? '<em>分</em>' : ''),
                                                    '<ul id="minute" class="ts-item-list" data-target="minute">' + scope.generateList('minute') + '</ul>',
                                                '</div>'].join('');
                                    })() : ''),
                                '</div>',
                                '<div class="ts-footer">',
                                    '<div class="btns-wrapper">',
                                        '<span class="ts-cancel-btn">' + (this.options.cancelValue ? this.options.cancelValue : 'Cancel') + '</span>',
                                        '<span class="ts-ok-btn">' + (this.options.okValue ? this.options.okValue : 'OK') + '</span>',
                                    '</div>',
                                '</div>',
                            '</div>'].join('');

            this.$wrapper.append(htmlTpl);

            this.attachEvents();

            // init initDate
            setTimeout(function(e) {
                var date = scope.initDate;

                scope.setState({
                    year   : date.getFullYear(),
                    month  : date.getMonth() + 1,
                    day    : date.getDate(),
                    hour   : date.getHours(),
                    minute : date.getMinutes()
                });
                $.extend(scope.stateCache, scope.stateTree);
            }, 300);
        },

        /*
         * show the tinyscroll
         */
        showScroller: function() {
            this.render();
        },

        /*
         * hide the tinyscroll
         */
        hideScroller: function() {
            var scope = this;

            this.setState(scope.stateCache);
            this.$wrapper.find('.tiny-scroll').removeClass('slideInUp').addClass('slideOutDown');
            this.$wrapper.find('.tiny-scroll-backdrop').hide();
        },

        /*
         * date initialize
         */
        dateInit: function() {
            var initDate = this.options.initDate,
                minDate = this.options.range[0],
                maxDate = this.options.range[1];

            this.initDate = this.dateTranslate(initDate);
            this.minDate = this.dateTranslate(minDate);
            this.maxDate = this.dateTranslate(maxDate);
        },

        /*
         * date translate, minute should be 0 or 30
         */
        dateTranslate: function(date) {
            var dateObj = typeof date === 'string' ? new Date(date) : date,
                mod = dateObj.getMinutes() % 30;

            mod > 30 ?
            (function() {
                dateObj.setHours(dateObj.getHours() + 1);
                dateObj.setMinutes(0);
            })() :
            (function() {
                dateObj.setMinutes(30);
            })();

            return dateObj;
        },

        /*
         * get month days
         */
        getMonthDays: function(year, month) {
            var isYeap = (year % 4 === 0) && ((year % 100 !== 0) || (year % 400 === 0)),
                monthDays = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31],
                monthDaysYeap = [31, 29, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];

            return isYeap ? monthDaysYeap[month] : monthDays[month];
        },

        /*
         * format date
         */
        formatDate: function(year, month, day, hour, minute) {
            year = parseInt(year || this.stateTree.year);
            month = parseInt(month || this.stateTree.month);
            day = parseInt(day || this.stateTree.day);
            hour = parseInt(hour || this.stateTree.hour);
            minute = parseInt(minute || this.stateTree.minute);

            if (this.options.time) {
                return year + '-' +
                    (month  > 9 ? month  : ('0' + month))  + '-' +
                    (day    > 9 ? day    : ('0' + day))    + ' ' +
                    (hour   > 9 ? hour   : ('0' + hour))   + ':' +
                    (minute > 9 ? minute : ('0' + minute)) + ':' +
                    '00';
            } else {
                return year + '-' +
                    (month  > 9 ? month  : ('0' + month))  + '-' +
                    (day    > 9 ? day    : ('0' + day));
            }
        },

        /*
         * generate list
         */
        generateList: function(type) {
            var minDate = this.minDate,
                maxDate = this.maxDate,
                initDate = this.initDate,
                tmpTpl = '';

            switch (type) {
                case 'year':
                    var maxYear = parseInt(maxDate.getFullYear()),
                        minYear = parseInt(minDate.getFullYear());

                    for (var y = 0; y <= maxYear - minYear; y++) {
                        tmpTpl += '<li data-index="' + (minYear + y) + '">' + (minYear + y) + '</li>';
                    }
                    break;
                case 'month':
                    for (var M = 1; M <= 12; M++) {
                        tmpTpl += '<li data-index="' + M + '">' + M + '</li>';
                    }
                    break;
                case 'day':
                    for (var d = 1; d < (this.getMonthDays(initDate.getFullYear(), initDate.getMonth()) + 1); d++) {
                        tmpTpl += '<li data-index="' + d + '">' + d + '</li>';
                    }
                    break;
                case 'hour':
                    for (var h = 0; h <= 23; h++) {
                        tmpTpl += '<li data-index="' + h + '">' + h + '</li>';
                    }
                    break;
                case 'minute':
                    for (var m = 0; m <= 30;) {
                        tmpTpl += '<li data-index="' + m + '">' + m + '</li>';
                        m += 30;
                    }
                    break;
                default:
                    break;
            }

            return tmpTpl;
        },

        /*
         * update stateTree
         */
        setState: function(props) {
            for (var prop in props) {
                if (this.stateTree[prop] >= 0) {
                    this.stateTree[prop] = props[prop];
                    this.fnList[prop].call(this);
                }
            }
        },

        /*
         * differ stateCache and stateTree
         */
        diffState: function(state1, state2) {
            var isEqual = true;

            for (var prop in state1) {
                if (state1[prop] != state2[prop]) {
                    isEqual = false;
                    break;
                }
            }

            return isEqual;
        },

        /*
         * highlight selected item
         */
        highlightSelected: function(type) {
            var target = this.$wrapper.find('#' + type);

            target.find('.selected').removeClass('selected');
            target.find('li[data-index="' + this.stateTree[type] + '"]').addClass('selected');
        },

        /*
         * year change callback
         */
        yearChanged: function(e) {
            // update year list position
            this.index2Pos(e, $(document.body).find('#year'), this.stateTree.year);
            // year change, update month
            this.monthListFix();
        },

        /*
         * month change callback
         */
        monthChanged: function(e) {
            // update month list position
            this.index2Pos(e, $(document.body).find('#month'), this.stateTree.month);
            // month change, update day
            this.dayListFix();
        },

        /*
         * day change callback
         */
        dayChanged: function(e) {
            // update day list position
            this.index2Pos(e, $(document.body).find('#day'), this.stateTree.day);
            // day change, update hour
            this.hourListFix();
        },

        /*
         * hour change callback
         */
        hourChanged: function(e) {
            // update day list position
            this.index2Pos(e, $(document.body).find('#hour'), this.stateTree.hour);
            // hour change, update minute
            this.minuteListFix();
        },

        /*
         * minute change callback
         */
        minuteChanged: function(e) {
            // update day list position
            this.index2Pos(e, $(document.body).find('#minute'), this.stateTree.minute);
        },

        /*
         * month list fix
         */
        monthListFix: function() {
            var monthTarget = this.$wrapper.find('#month'),
                maxDate = this.maxDate,
                minDate = this.minDate;

            // minimum month
            var minMonth = minDate.getMonth();
            if (this.stateTree.year == minDate.getFullYear()) {
                this.disablePrevItems('month', minMonth + 1);
                this.mTopLocked = true;
                this.mBottomLocked = false;
                if (this.stateTree.month < minMonth + 1) {
                    this.setState({ month: minMonth + 1 });
                }
            } else {
                this.enablePrevItems('month');
                this.mTopLocked = false;

                // maximum month
                var maxMonth = maxDate.getMonth();
                if (this.stateTree.year == maxDate.getFullYear()) {
                    this.disableNextItems('month', maxMonth + 1);
                    this.mBottomLocked = true;
                    this.mTopLocked = false;
                    if (this.stateTree.month > maxMonth + 1) {
                        this.setState({ month: maxMonth + 1 });
                    }
                } else {
                    this.enableNextItems('month');
                    this.mBottomLocked = false;
                }
            }

            // trigger dayListFix
            this.dayListFix();
        },

        /*
         * day list fix
         */
        dayListFix: function() {
            var dayTarget = this.$wrapper.find('#day'),
                originalLength = dayTarget.children().length,
                newLength = this.getMonthDays(this.stateTree.year, this.stateTree.month - 1),
                maxDate = this.maxDate,
                minDate = this.minDate;

            // minimum day
            var minDay = minDate.getDate();
            if (this.mTopLocked &&  this.stateTree.month == (minDate.getMonth() + 1)) {
                this.disablePrevItems('day', minDay);
                this.dTopLocked = true;
                this.dBottomLocked = false;
                if (this.stateTree.day < minDay) {
                    this.setState({ day: minDay });
                }
            } else {
                this.enablePrevItems('day');
                this.dTopLocked = false;

                // maximum day
                var maxDay = maxDate.getDate();
                if (this.mBottomLocked && this.stateTree.month == (maxDate.getMonth() + 1)) {
                    this.disableNextItems('day', maxDay);
                    this.dBottomLocked = true;
                    this.dTopLocked = false;
                    if (this.stateTree.day > maxDay) {
                        this.setState({ day: maxDay });
                    }
                } else {
                    this.enableNextItems('day');
                    this.dBottomLocked = false;
                }
            }

            if (newLength > originalLength) {
                for (var i = originalLength + 1; i <= newLength; i++) {
                    dayTarget.append('<li data-index="' + i + '">' + i + '</li>');
                }
            } else if (newLength < originalLength) {
                for (var j = 0; j < originalLength - newLength; j ++) {
                    dayTarget.children().last().remove();
                }
                if (dayTarget.children().last().data('index') <= this.stateTree.day) {
                    this.setState({ day: dayTarget.children().last().data('index') });
                }
            }

            // trigger hourListFix
            this.hourListFix();
        },

        /*
         * hour list fix
         */
        hourListFix: function() {
            var hourTarget = this.$wrapper.find('#hour'),
                maxDate = this.maxDate,
                minDate = this.minDate;

            // minimum hour
            var minHour = minDate.getHours();
            if (this.dTopLocked && this.stateTree.day == minDate.getDate()) {
                this.disablePrevItems('hour', minHour);
                this.hhTopLocked = true;
                this.hhBottomLocked = false;
                if (this.stateTree.hour < minHour) {
                    this.setState({ hour: minHour });
                }
            } else {
                this.enablePrevItems('hour');
                this.hhTopLocked = false;

                // maximum hour
                var maxHour = maxDate.getHours();
                if (this.dBottomLocked && this.stateTree.day == maxDate.getDate()) {
                    this.disableNextItems('hour', maxHour);
                    this.hhBottomLocked = true;
                    this.hhTopLocked = false;
                    if (this.stateTree.hour > maxHour) {
                        this.setState({ hour: maxHour });
                    }
                } else {
                    this.enableNextItems('hour');
                    this.hhBottomLocked = false;
                }
            }

            // trigger minuteListFix
            this.minuteListFix();
        },

        /*
         * minute list fix
         */
         minuteListFix: function() {
             var minuteTarget = this.$wrapper.find('#minute'),
                 maxDate = this.maxDate,
                 minDate = this.minDate;

             // minimum minute
             var minMinute = minDate.getMinutes();
             if (this.hhTopLocked && this.stateTree.hour == minDate.getHours()) {
                 this.disablePrevItems('minute', minMinute);
                 this.mmTopLocked = true;
                 this.mmBottomLocked = false;
                 if (this.stateTree.minute < minMinute) {
                     this.setState({ minute: minMinute });
                 }
             } else {
                 this.enablePrevItems('minute');
                 this.mmTopLocked = false;

                 // maximum minute
                 var maxMinute = maxDate.getMinutes();
                 if (this.hhBottomLocked && this.stateTree.hour == maxDate.getHours()) {
                     this.disableNextItems('minute', maxMinute);
                     this.mmBottomLocked = true;
                     this.mmTopLocked = false;
                     if (this.stateTree.minute > maxMinute) {
                         this.setState({ minute: maxMinute });
                     }
                 } else {
                     this.enableNextItems('minute');
                     this.mmBottomLocked = false;
                 }
             }
        },

        /*
         * disable month or day list items which overflow
         */
        disablePrevItems: function(type, index) {
            var target = this.$wrapper.find('#' + type);

            target.children('.disable').removeClass('disable');
            target.find('[data-index="' + index + '"]').prevAll().addClass('disable');
        },

        /*
         * disable month or day list items which overflow
         */
        disableNextItems: function(type, index) {
            var target = this.$wrapper.find('#' + type);

            target.children('.disable').removeClass('disable');
            target.find('[data-index="' + index + '"]').nextAll().addClass('disable');
        },

        /*
         * enable moth or day list items
         */
        enablePrevItems: function(type) {
            this.$wrapper.find('#' + type).children().prevAll('.disable').removeClass('disable');
        },

        /*
         * enable moth or day list items
         */
        enableNextItems: function(type) {
            this.$wrapper.find('#' + type).children().nextAll('.disable').removeClass('disable');
        },

        /*
         * init touch events
         */
        attachEvents: function() {
            var scope = this;

            this.$wrapper.on('click', '.tiny-scroll-backdrop', function(e) {
                scope.hideScroller();
            });

            this.$wrapper.on('touchstart touchmove touchend touchcancel', '.ts-item-list', function(e) {
                this.$target = $(e.target).hasClass('.ts-item-list') ? $(e.target) : $(e.target).parents('.ts-item-list');

                switch (e.originalEvent.type) {
                    case 'touchstart'  :
                        scope.touchStart.call(scope, e, this.$target); break;
                    case 'touchmove'   :
                        scope.touchMove.call(scope, e, this.$target);  break;
                    case 'touchend'    :
                    case 'touchcancel' :
                        scope.touchEnd.call(scope, e, this.$target);   break;
                    default            :
                        break;
                }
            });

            this.$wrapper.on('click', '.ts-cancel-btn', function() {
                scope.setState(scope.stateCache);
                scope.hideScroller();
            });

            this.$wrapper.on('click', '.ts-ok-btn', function() {
                $.extend(scope.stateCache, scope.stateTree);
                scope.hideScroller();
                scope.options.okCallback && typeof scope.options.okCallback === 'function' && scope.options.okCallback(scope.formatDate());
            });
        },

        /*
         * touch start
         */
        touchStart: function(e) {
            if (this.freezing) return;

            e.preventDefault();

            var target = $(e.target).parents('.ts-item-list'), offsetTop;

            if (target.length) {
                this.moving = true;
                this.touchTime = e.timeStamp;
                this.curTopMap[target.data('target')] = this.curTopMap[target.data('target')] ? this.curTopMap[target.data('target')] : 0;

                offsetTop = e.originalEvent.touches[0].pageY;
                this.touchY = offsetTop - this.curTopMap[target.data('target')];
                this.moving = true;
            }
        },

        /*
         * touch move
         */
        touchMove: function(e, target) {
            if (!this.moving) return false;

            e.preventDefault();

            var offsetTop = e.originalEvent.touches[0].pageY;

            this.curTopMap[target.data('target')] = offsetTop - this.touchY;
            target.css('transform', 'translate3d(0px, ' + this.curTopMap[target.data('target')] + 'px, 0px)');
        },

        /*
         * touch end
         */
        touchEnd: function(e, target) {
            if (!this.moving) return false;

            this.freezing = true;

            var scope = this,
                curTop = this.curTopMap[target.data('target')],
                mod = curTop % CHILD_HEIGHT;

            mod > 0 ?
            (function() {
                // overflow top
                if (curTop > CHILD_HEIGHT * 2) {
                    scope.translateYUpdate(target, CHILD_HEIGHT * 2);
                    scope.touchEndEvent(e, target);
                    return;
                }

                if (mod > (CHILD_HEIGHT / 2)) {
                    scope.translateYUpdate(target, (curTop + CHILD_HEIGHT - mod));
                    scope.touchEndEvent(e, target);
                } else {
                    scope.translateYUpdate(target, (curTop - mod));
                    scope.touchEndEvent(e, target);
                }
            })() : (function() {
                // overflow bottom
                var scrollBottomHeight = ($(e.target).parents('.ts-item-list').outerHeight() - CHILD_HEIGHT * 3);

                if (Math.abs(curTop) > scrollBottomHeight) {
                    scope.translateYUpdate(target, -scrollBottomHeight);
                    scope.touchEndEvent(e, target);
                    return;
                }

                if (mod < -(CHILD_HEIGHT / 2)) {
                    scope.translateYUpdate(target, (curTop - CHILD_HEIGHT - mod));
                    scope.touchEndEvent(e, target);
                } else {
                    scope.translateYUpdate(target, (curTop - mod));
                    scope.touchEndEvent(e, target);
                }
            })();
        },

        /*
         * touchend event
         */
        touchEndEvent: function(e, target) {
            this.pos2Index(e, this.curTopMap[target.data('target')]);
            this.moving = false;
            this.freezing = false;
        },

        /*
         * transform update
         */
        translateYUpdate: function(element, translateY) {
            var target = element.data('target');

            element.css('transform', 'translate3d(0px, ' + translateY + 'px, 0px)');
            this.curTopMap[target] = translateY;
            this.highlightSelected(target);
        },

        /*
         * translate position to selected item with index
         */
        pos2Index: function(e, pos) {
            var target = $(e.target).parents('.ts-item-list'),
                targetId = target.attr('id'),
                dataIndex = target.find('li').eq(2 - (pos / CHILD_HEIGHT)).data('index'),
                minDate = this.minDate,
                maxDate = this.maxDate;

            switch (targetId) {
                case 'year':
                    this.setState({ year: dataIndex });
                    break;
                case 'month':
                    if (this.mTopLocked === true && (dataIndex < minDate.getMonth() + 1)) {
                        this.setState({ month: minDate.getMonth() + 1 });
                    } else if (this.mBottomLocked === true && (dataIndex > maxDate.getMonth() + 1)) {
                        this.setState({ month: maxDate.getMonth() + 1 });
                    } else {
                        this.setState({ month: dataIndex });
                    }
                    break;
                case 'day':
                    if (this.dTopLocked === true && (dataIndex < minDate.getDate())) {
                        this.setState({ day: minDate.getDate() });
                    } else if (this.dBottomLocked === true && (dataIndex > maxDate.getDate())) {
                        this.setState({ day: maxDate.getDate() });
                    } else {
                        this.setState({ day: dataIndex });
                    }
                    break;
                case 'hour':
                    if (this.hhTopLocked === true && (dataIndex < minDate.getHours())) {
                        this.setState({ hour: minDate.getHours() });
                    } else if (this.hhBottomLocked === true && (dataIndex > maxDate.getHours())) {
                        this.setState({ hour: maxDate.getHours() });
                    } else {
                        this.setState({ hour: dataIndex });
                    }
                    break;
                case 'minute':
                    if (this.mmTopLocked === true && (dataIndex < minDate.getMinutes())) {
                        this.setState({ minute: minDate.getMinutes() });
                    } else if (this.mmBottomLocked === true && (dataIndex > maxDate.getMinutes())) {
                        this.setState({ minute: maxDate.getMinutes() });
                    } else {
                        this.setState({ minute: dataIndex });
                    }
                    break;
                default:
                    break;
            }
        },

        /*
         * translate item with index to position
         */
        index2Pos: function(e, parent, index) {
            var scope = this,
                childItem = parent.find('[data-index="' + parseInt(index) + '"]'),
                itemIndex = childItem.index(),
                count = itemIndex - 2;

            this.translateYUpdate(parent, -(CHILD_HEIGHT * count));
        }
    };

    return TinyScroll;

}));
