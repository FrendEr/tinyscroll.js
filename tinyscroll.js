/*
 * ===============================================
 *
 * @name    tinyscroll.js
 * @author  Frend
 * @github  https://github.com/Frend/tinyscroll.js
 *
 * ===============================================
 */

;(function(root, factory) {
    if (typeof defien === 'function' && define.amd) {
        define(['jquery'], function($) { return factory(); });
    } else if (typeof module !== 'undefined' && module.exports) {
        module.exports = factory();
    } else {
        window[root] = factory();
    }
}('TinyScroll', function() {

    'use strict';

    var CHILD_HEIGHT  = 30;     // 30px
    var DURATION_TIME = 50;     // 50ms

    function TinyScroll(options) {
        this.options       = $.extend({}, options);                      // options
        this.$wrapper      = $(this.options.wrapper);                    // root element
        this.$target       = null;                                       // the target element
        this.targetTop     = 0;                                          // drag target's top
        this.targetHeight  = 0;                                          // drag target's height
        this.childHeight   = CHILD_HEIGHT;                               // child element's height
        this.freezing      = false;                                      // is freezing
        this.moving        = false;                                      // is moving
        this.curTopMap     = {};                                         // scroll item current top
        this.oriTopMap     = {};                                         // scroll item original top
        this.touchTime     = 0;                                          // touch start timestamp
        this.touchY        = 0;                                          // touch start point postion
        this.timeGap       = 0;                                          // time gap
        this.moveState     = 'down';                                     // move state, up or down
        this.mTopLocked    = false;                                      // month scroll to top locked
        this.mBottomLocked = false;                                      // month scroll to bottom locked
        this.dTopLocked    = false;                                      // day scroll to top locked
        this.dBottomLocked = false;                                      // day scroll to bottom locked
        this.stateTree     = {                                           // state tree
            year:  this.options.year  || 10000,
            month: this.options.month || 10000,
            day:   this.options.day   || 10000
        };
        this.stateCache    = {                                           // state tree cache
            year:  this.options.year  || 10000,
            month: this.options.month || 10000,
            day:   this.options.day   || 10000
        };
        this.fnList        = {                                           // function list
            year:  this.yearChanged,
            month: this.monthChanged,
            day:   this.dayChanged
        };

        this.init();

        // init initDate
        var scope = this;
        setTimeout(function(e) {
            var date = new Date(scope.options.initDate);

            scope.setState({ year: date.getFullYear(), month: date.getMonth() + 1, day: date.getDate() });
            $.extend(scope.stateCache, scope.stateTree);
        }, 300);
    }

    TinyScroll.prototype = {

        constructor: TinyScroll,

        /*
         * initialize app
         */
        init: function() {
            if (new Date(this.options.initDate) < new Date(this.options.range[0]) || new Date(this.options.initDate) > new Date(this.options.range[1])) {
                throw 'Error: the initDate is ERROR!';
            }

            this.render();
        },

        /*
         * before tinyscroll render
         */
        beforeRender: function() {
            if (this.$wrapper.children().length !== 0) {
                this.$wrapper.find('.tiny-scroll-backdrop').show();
                this.$wrapper.find('.tiny-scroll').addClass('fadeInUp');
                return false;
            }
        },

        /*
         * render app
         */
        render: function() {
            var scope = this,
                isEqual = this.diffState(scope.stateCache, scope.stateTree);

            // if (!isEqual) {
            //     $.extend(scope.stateCache, scope.stateTree);
            //     scope.setState(scope.stateTree);
            // }

            if (this.$wrapper.children().length !== 0) {
                this.$wrapper.find('.tiny-scroll-backdrop').show();
                this.$wrapper.find('.tiny-scroll').removeClass('fadeOutDown').addClass('fadeInUp');
                return;
            }

            var htmlTpl = ['<div class="tiny-scroll-backdrop"></div>',
                            '<div class="tiny-scroll fadeInUp animated">',
                                '<div class="ts-header">' + this.options.title + '</div>',
                                '<div class="ts-body">',
                                    '<div class="ts-mask"></div>',
                                    '<div class="ts-front"></div>',
                                    '<div class="ts-col">',
                                        '<ul id="year" class="ts-item-list" data-target="year">' + this.generateList('year') + '</ul>',
                                    '</div>',
                                    '<div class="ts-col">',
                                        '<ul id="month" class="ts-item-list" data-target="month">' + this.generateList('month') + '</ul>',
                                    '</div>',
                                    '<div class="ts-col">',
                                        '<ul id="day" class="ts-item-list" data-target="day">' + this.generateList('day') + '</ul>',
                                    '</div>',
                                '</div>',
                                '<div class="ts-footer">',
                                    '<div class="btns-wrapper">',
                                        '<span class="ts-cancel-btn">' + (this.options.cancelValue ? this.options.cancelValue : 'Cancel') + '</span>',
                                        '<span class="ts-ok-btn">' + (this.options.okValue ? this.options.okValue : 'OK') + '</span>',
                                    '</div>',
                                '</div>',
                            '</div>'].join('');

            this.$wrapper.append(htmlTpl);

            this.eventBinding();
        },

        /*
         * show the tinyscroll
         */
        show: function() {
            this.render();
        },

        /*
         * hide the tinyscroll
         */
        hide: function() {
            var scope = this;

            this.setState(scope.stateCache);
            this.$wrapper.find('.tiny-scroll').removeClass('fadeInUp').addClass('fadeOutDown');
            this.$wrapper.find('.tiny-scroll-backdrop').hide();
        },

        /*
         * get min date
         */
        getMinDate: function() {
            var scope = this;

            return new Date(scope.options.range[0]);
        },

        /*
         * get max date
         */
        getMaxDate: function() {
            var scope = this;

            return new Date(scope.options.range[1]);
        },

        /*
         * get init date
         */
        getInitDate: function() {
            var scope = this;

            return new Date(scope.options.initDate);
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
         * generate list
         */
        generateList: function(type) {
            var minDate = this.getMinDate(),
                maxDate = this.getMaxDate(),
                initDate = this.getInitDate(),
                tmpTpl = '';

            if (type == 'year') {
                var maxYear = parseInt(maxDate.getFullYear()),
                    minYear = parseInt(minDate.getFullYear());

                for (var i = 0; i <= maxYear - minYear; i++) {
                    tmpTpl += '<li data-index="' + (minYear + i) + '">' + (minYear + i) + '</li>';
                }
            } else if (type == 'month') {
                for (var j = 1; j <= 12; j++) {
                    tmpTpl += '<li data-index="' + j + '">' + j + '</li>';
                }
            } else if (type == 'day') {
                for (var k = 1; k < (this.getMonthDays(initDate.getFullYear(), initDate.getMonth()) + 1); k++) {
                    tmpTpl += '<li data-index="' + k + '">' + k + '</li>';
                }
            }

            return tmpTpl;
        },

        /*
         * update stateTree
         */
        setState: function(props) {
            for (var prop in props) {
                if (this.stateTree[prop] && props[prop] !== this.stateTree[prop]) {
                    this.stateTree[prop] = props[prop];
                    this.fnList[prop].call(this);

                    if (this.mTopLocked && props[prop] < this.stateTree[prop]) {
                        console.info('Month top has locked! Do not move!');
                    }
                    if (this.dTopLocked && props[prop] < this.stateTree[prop]) {
                        console.info('Day top has locked! Do not move!');
                    }
                    if (this.mBottomLocked && props[prop] > this.stateTree[prop]) {
                        console.info('Month bottom has locked! Do not move!');
                    }
                    if (this.dBottomLocked && props[prop] > this.stateTree[prop]) {
                        console.info('Day bottom has locked! Do not move!');
                    }
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
         * year change callback
         */
        yearChanged: function(e) {
            console.log('year change to : ' + this.stateTree.year);
            // update year list position
            this.indexTransPos(e, $(document.body).find('#year'), this.stateTree.year);
            // month && day list fix
            this.monthListFix();
            this.dayListFix();
        },

        /*
         * month change callback
         */
        monthChanged: function(e) {
            console.log('month changed to : ' + this.stateTree.month);
            // update month list position
            this.indexTransPos(e, $(document.body).find('#month'), this.stateTree.month);
            // month && day list fix
            this.monthListFix();
            this.dayListFix();
        },

        /*
         * day change callback
         */
        dayChanged: function(e) {
            console.log('day changed to : ' + this.stateTree.day);
            // update day list position
            this.indexTransPos(e, $(document.body).find('#day'), this.stateTree.day);
            this.dayListFix();
        },

        /*
         * month list fix
         */
        monthListFix: function() {
            var monthTarget = this.$wrapper.find('#month'),
                maxDate = this.getMaxDate(),
                minDate = this.getMinDate();

            // minimum date
            var minMonth = minDate.getMonth();
            if (this.stateTree.year == minDate.getFullYear()) {
                console.log('reach min year');
                this.disablePrevItems('month', minMonth);

                if (this.stateTree.month <= minMonth) {
                    this.mTopLocked = true;
                    this.setState({ month: minMonth + 1 });
                }
            } else {
                this.enablePrevItems('month', minMonth);
                this.mTopLocked = false;

                // maximum date
                var maxMonth = maxDate.getMonth();
                if (this.stateTree.year == maxDate.getFullYear()) {
                    console.log('reach max year');
                    this.disableNextItems('month', maxMonth);

                    if (this.stateTree.month > maxMonth) {
                        this.mBottomLocked = true;
                        this.setState({ month: maxMonth + 1 });
                    }
                } else {
                    this.enableNextItems('month', maxMonth);
                    this.mBottomLocked = false;
                }
            }
        },

        /*
         * day list fix
         */
        dayListFix: function() {
            var dayTarget = this.$wrapper.find('#day'),
                originalLength = dayTarget.children().length,
                newLength = this.getMonthDays(this.stateTree.year, this.stateTree.month - 1),
                maxDate = this.getMaxDate(),
                minDate = this.getMinDate();

            // minimum date
            var minDay = minDate.getDate();
            if (this.stateTree.year == minDate.getFullYear() &&  this.stateTree.month == (minDate.getMonth() + 1)) {
                console.log('reach min month');
                this.disablePrevItems('day', minDay - 1);

                if (this.stateTree.day < minDay) {
                    this.dTopLocked = true;
                    this.setState({ day: minDay });
                }
            } else {
                this.enablePrevItems('day', minDay - 1);
                this.dTopLocked = false;

                // maximum date
                var maxDay = maxDate.getDate();
                if (this.stateTree.year == maxDate.getFullYear() && this.stateTree.month == (maxDate.getMonth() + 1)) {
                    console.log('reach max month');
                    this.disableNextItems('day', maxDay - 1);

                    if (this.stateTree.day > maxDay) {
                        this.dBottomLocked = true;
                        this.setState({ day: maxDay });
                    }
                } else {
                    this.enableNextItems('day', maxDay - 1);
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
        },

        /*
         * disable month or day list items which overflow
         */
        disablePrevItems: function(type, index) {
            this.$wrapper.find('#' + type).children().eq(index).prevAll().addClass('disable');
        },

        /*
         * disable month or day list items which overflow
         */
        disableNextItems: function(type, index) {
            this.$wrapper.find('#' + type).children().eq(index).nextAll().addClass('disable');
        },

        /*
         * enable moth or day list items
         */
        enablePrevItems: function(type, index) {
            this.$wrapper.find('#' + type).children().prevAll('.disable').removeClass('disable');
        },

        /*
         * enable moth or day list items
         */
        enableNextItems: function(type, index) {
            this.$wrapper.find('#' + type).children().nextAll('.disable').removeClass('disable');
        },

        /*
         * init touch events
         */
        eventBinding: function() {
            var scope = this;

            this.$wrapper.on('click', '.tiny-scroll-backdrop', function(e) {
                scope.hide();
            });

            this.$wrapper.on('touchstart touchmove touchend', '.ts-item-list', function(e) {
                this.$target = $(e.target).hasClass('.ts-item-list') ? $(e.target) : $(e.target).parents('.ts-item-list');

                switch (e.originalEvent.type) {
                    case 'touchstart' :
                        scope.touchStart.call(scope, e, this.$target); break;
                    case 'touchmove'  :
                        scope.touchMove.call(scope, e, this.$target);  break;
                    case 'touchend'   :
                        scope.touchEnd.call(scope, e, this.$target);   break;
                    default           :
                        break;
                }
            });

            this.$wrapper.on('click', '.ts-cancel-btn', function() {
                // $.extend(scope.stateTree, scope.stateCache);
                scope.setState(scope.stateCache);
                scope.hide();
            });

            this.$wrapper.on('click', '.ts-ok-btn', function() {
                $.extend(scope.stateCache, scope.stateTree);
                scope.hide();
            });
        },

        /*
         * touch start
         */
        touchStart: function(e) {
            if (this.freezing) return;

            e.stopPropagation();

            var target = $(e.target).parents('.ts-item-list'), offsetTop;

            if (target.length) {
                this.moving = true;
                this.touchTime = e.timeStamp;
                this.curTopMap[target.data('target')] = this.curTopMap[target.data('target')] ? this.curTopMap[target.data('target')] : 0;

                offsetTop = this.getPointPos(e.originalEvent.touches[0]);
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
            e.stopPropagation();

            var offsetTop = this.getPointPos(e.originalEvent.touches[0]);

            this.curTopMap[target.data('target')] = offsetTop - this.touchY;
            target.css('top', this.curTopMap[target.data('target')] + 'px');
        },

        /*
         * touch end
         */
        touchEnd: function(e, target) {
            if (!this.moving) return false;

            e.stopPropagation();
            this.freezing = true;

            var scope = this,
                curTop = this.curTopMap[target.data('target')],
                mod = curTop % CHILD_HEIGHT;

            this.moveState = mod > 0 ?
            (function() {
                // overflow top
                if (curTop > CHILD_HEIGHT * 2) {
                    target.animate({
                        'top': CHILD_HEIGHT * 2 + 'px'
                    }, DURATION_TIME, function() {
                        scope.curTopMap[target.data('target')] = CHILD_HEIGHT * 2;
                        scope.touchEndEvent(e, target);
                    });
                    return;
                }

                if (mod > (CHILD_HEIGHT / 2)) {
                    target.animate({
                        'top': (curTop + CHILD_HEIGHT - mod) + 'px'
                    }, DURATION_TIME, function() {
                        scope.curTopMap[target.data('target')] = curTop + CHILD_HEIGHT - mod;
                        scope.touchEndEvent(e, target);
                    });
                } else {
                    target.animate({
                        'top': (curTop - mod) + 'px'
                    }, DURATION_TIME, function() {
                        scope.curTopMap[target.data('target')] = curTop - mod;
                        scope.touchEndEvent(e, target);
                    });
                }
            })() : (function() {
                // overflow bottom
                var scrollBottomHeight = ($(e.target).parents('.ts-item-list').outerHeight() - scope.childHeight * 3);

                if (Math.abs(curTop) > scrollBottomHeight) {
                    target.animate({
                        'top': -scrollBottomHeight + 'px'
                    }, DURATION_TIME, function() {
                        scope.curTopMap[target.data('target')] = -scrollBottomHeight;
                        scope.touchEndEvent(e, target);
                    });
                    return;
                }

                if (mod < -(CHILD_HEIGHT / 2)) {
                    target.animate({
                        'top': (curTop - CHILD_HEIGHT - mod) + 'px'
                    }, DURATION_TIME, function() {
                        scope.curTopMap[target.data('target')] = curTop - CHILD_HEIGHT - mod;
                        scope.touchEndEvent(e, target);
                    });
                } else {
                    target.animate({
                        'top': (curTop - mod) + 'px'
                    }, DURATION_TIME, function() {
                        scope.curTopMap[target.data('target')] = curTop - mod;
                        scope.touchEndEvent(e, target);
                    });
                }
            })();
        },

        /*
         * touchend event
         */
        touchEndEvent: function(e, target) {
            this.posTransIndex(e, this.curTopMap[target.data('target')]);
            this.moving = false;
            this.freezing = false;
        },

        /*
         * translate position to selected item with index
         */
        posTransIndex: function(e, pos) {
            var target = $(e.target).parents('.ts-item-list'),
                targetId = target.attr('id'),
                dataIndex = target.find('li').eq(2 - (pos / CHILD_HEIGHT)).data('index');

            switch (targetId) {
                case 'year'  :
                    this.setState({ year: dataIndex }); break;
                case 'month' :
                    this.setState({ month: dataIndex }); break;
                case 'day'   :
                    this.setState({ day: dataIndex }); break;
                default      :
                    break;
            }
        },

        /*
         * translate item with index to position
         */
        indexTransPos: function(e, parent, index) {
            var scope = this,
                childItem = parent.find('[data-index="' + parseInt(index) + '"]'),
                itemIndex = childItem.index(),
                count = itemIndex - 2;

            parent.animate({
                'top': -(CHILD_HEIGHT * count) + 'px'
            }, DURATION_TIME, function() {
                scope.curTopMap[parent.data('target')] = -(CHILD_HEIGHT * count);
            });
        },

        /*
         * get the touch point's postion
         */
        getPointPos: function(e) {
            return Math.max(document.body.scrollTop, document.documentElement.scrollTop) + e.clientY;
        }
    };

    return TinyScroll;

}));
