var TIMETRACKER,
  indexOf = [].indexOf || function(item) { for (var i = 0, l = this.length; i < l; i++) { if (i in this && this[i] === item) return i; } return -1; },
  slice = [].slice;

Vue.directive('click-outside', {
  bind: function(el, binding, vnode) {
    el.clickOutsideEvent = function(e) {
      if (el !== e.target || !el.contains(e.target)) {
        return vnode.context[binding.expression](e);
      }
    };
    return document.body.addEventListener('click', el.clickOutsideEvent);
  },
  unbind: function(el) {
    return document.body.removeEventListener('click', el.clickOutsideEvent);
  }
});

Vue.filter('millis', function(ms) {
  var hours, minutes, seconds;
  ms = (ms * .001) | 0;
  seconds = ms % 60;
  minutes = ((ms / 60) % 60) | 0;
  hours = (ms / 60 / 60) | 0;
  if (seconds < 10) {
    seconds = "0" + seconds;
  }
  if (minutes < 10) {
    minutes = "0" + minutes;
  }
  return hours + ":" + minutes + ":" + seconds;
});

Vue.filter('loctime', function(ts) {
  return new Date(ts).toLocaleString('ru-RU');
});

TIMETRACKER = {
  Settings: {
    dataStorageKey: 'timetracker-data'
  },
  Data: {
    current: 'Default',
    data: {
      'Default': []
    }
  }
};

Vue.component('title-view', {
  template: '#title-tmpl',
  props: ['projects', 'current', 'startDate'],
  data: function() {
    return {
      opened: false,
      selected: this.current
    };
  },
  computed: {
    projectTitles: function() {
      return _.keys(this.projects);
    }
  },
  methods: {
    toggle: function() {
      return this.opened = !this.opened;
    },
    onOutside: function() {
      return this.opened = false;
    },
    add: function() {
      var title;
      if (this.startDate) {
        return alert('Нельзя добавить проект пока работает таймер');
      }
      title = prompt('Введите название нового проекта:');
      title = title.replace(/^\s+|\s+$/g, '');
      if (!title) {
        return alert('Вы не ввели название проекта');
      }
      if (indexOf.call(_.keys(this.projects), title) >= 0) {
        return alert('Такой проект уже существует');
      }
      this.selected = title;
      return this.$emit('add:project', title);
    },
    remove: function() {
      if (this.startDate) {
        return alert('Нельзя удалить проект пока работает таймер');
      }
      if (confirm('Вы действительно хотите БЕЗВОЗВРАТНО удалить проект?')) {
        if (this.selected === 'Default') {
          return alert('Нельзя удалить проект `Default`');
        }
        this.$emit('remove:project', this.selected);
        return this.selected = 'Default';
      }
    },
    select: function() {
      if (this.startDate) {
        return alert('Нельзя добавить проект пока работает таймер');
      }
      return this.$emit('change:current', this.selected);
    }
  }
});

Vue.component('timer-view', {
  template: '#timer-tmpl',
  props: ['projects', 'current', 'startDate'],
  data: function() {
    return {
      running: false
    };
  },
  computed: {
    times: function() {
      return this.projects[this.current] || [];
    },
    total: function() {
      return _.reduce(this.times, function(val, time) {
        return val + (time.endTs - time.startTs);
      }, 0);
    },
    opened: function() {
      return _.chain(this.times).filter(function(time) {
        return !time.closed;
      }).reduce(function(val, time) {
        return val + (time.endTs - time.startTs);
      }, 0).value();
    },
    time: function() {
      if (this.startDate) {
        return new Date().getTime() - this.startDate.getTime();
      } else {
        return 0;
      }
    }
  },
  methods: {
    toggle: function() {
      this.running = !this.running;
      return this.$emit('timer:toggle', this.running);
    }
  }
});

Vue.component('times-view', {
  template: '#times-tmpl',
  props: ['projects', 'current', 'startDate'],
  computed: {
    times: function() {
      return this.projects[this.current] || [];
    },
    exist: function() {
      return this.times.length;
    }
  },
  methods: {
    close: function(time) {
      return this.$emit('times:change', _.map(this.times, function(t) {
        if (t.startTs === time.startTs && t.endTs === time.endTs) {
          t.closed = !t.closed;
        }
        return t;
      }));
    },
    remove: function(time) {
      return this.$emit('times:change', _.filter(this.times, function(t) {
        return t.startTs !== time.startTs && t.endTs !== time.endTs;
      }));
    }
  }
});

Vue.component('time-view', {
  template: '#time-tmpl',
  props: ['time', 'startDate'],
  data: function() {
    return {
      closed: this.time.closed
    };
  },
  computed: {
    diff: function() {
      return this.time.endTs - this.time.startTs;
    }
  },
  methods: {
    close: function() {
      if (this.startDate) {
        return alert('Нельзя учесть пока работает таймер');
      }
      return this.$emit('time:close', this.time);
    },
    remove: function() {
      if (this.startDate) {
        return alert('Нельзя удалить пока работает таймер');
      }
      if (confirm('Действительно хотите удалить\nбез возможности восстановить?')) {
        return this.$emit('time:remove', this.time);
      }
    }
  }
});

window.onload = function() {
  new Vue({
    el: '#app-container',
    template: '#layout-tmpl',
    _loopCounter: 0,
    _curDesc: '',
    data: function() {
      return {
        projects: {},
        current: 'Default',
        startDate: null
      };
    },
    created: function() {
      return this.loadData();
    },
    methods: {
      loadData: function() {
        var err;
        try {
          TIMETRACKER.Data = JSON.parse(window.localStorage.getItem(TIMETRACKER.Settings.dataStorageKey)) || TIMETRACKER.Data;
        } catch (error) {
          err = error;
        }
        this.projects = TIMETRACKER.Data.data;
        return this.current = TIMETRACKER.Data.current;
      },
      saveData: function() {
        return window.localStorage.setItem(TIMETRACKER.Settings.dataStorageKey, JSON.stringify(TIMETRACKER.Data));
      },
      saveAndLoad: function() {
        this.saveData();
        return this.loadData();
      },
      changeCurrent: function(val) {
        TIMETRACKER.Data.current = val;
        return this.saveAndLoad();
      },
      addProject: function(val) {
        TIMETRACKER.Data.current = val;
        TIMETRACKER.Data.data[val] = [];
        return this.saveAndLoad();
      },
      removeProject: function(val) {
        TIMETRACKER.Data.current = 'Default';
        delete TIMETRACKER.Data.data[val];
        return this.saveAndLoad();
      },
      timesChange: function(times) {
        TIMETRACKER.Data.data[this.current] = times;
        return this.saveAndLoad();
      },
      saveTimer: function(insert) {
        var timeItem, times;
        if (insert == null) {
          insert = false;
        }
        times = this.projects[this.current];
        timeItem = {
          startTs: this.startDate.getTime(),
          endTs: new Date().getTime(),
          desc: this._curDesc,
          closed: false
        };
        if (insert) {
          times = [timeItem].concat(slice.call(times));
        } else {
          times = [timeItem].concat(slice.call(times.slice(1)));
        }
        this.projects[this.current] = times;
        return this.saveAndLoad();
      },
      timerToggle: function(running) {
        if (running) {
          this._loopCounter = 0;
          this.startDate = new Date;
          this._curDesc = prompt('Можете ввести пояснение:') || '';
          this._curDesc = this._curDesc.replace(/^\s+|\s+$/g, '');
          this.saveTimer(true);
          return window.requestAnimationFrame(this.loop);
        } else {
          this.saveTimer();
          return this.startDate = null;
        }
      },
      loop: function() {
        this._loopCounter += 1;
        if (this.startDate) {
          if (this._loopCounter % 60 === 0) {
            this.saveTimer();
          }
          requestAnimationFrame(this.loop);
        }
        return null;
      }
    }
  });
  return null;
};

//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibWFpbi5qcyIsInNvdXJjZXMiOlsibWFpbi5jb2ZmZWUiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUEsSUFBQSxXQUFBO0VBQUE7OztBQUFBLEdBQUcsQ0FBQyxTQUFKLENBQWMsZUFBZCxFQUErQjtFQUMzQixJQUFBLEVBQU0sU0FBQyxFQUFELEVBQUssT0FBTCxFQUFjLEtBQWQ7SUFDRixFQUFFLENBQUMsaUJBQUgsR0FBdUIsU0FBQyxDQUFEO01BQ25CLElBQUcsRUFBQSxLQUFNLENBQUMsQ0FBQyxNQUFSLElBQWtCLENBQUksRUFBRSxDQUFDLFFBQUgsQ0FBWSxDQUFDLENBQUMsTUFBZCxDQUF6QjtlQUNJLEtBQUssQ0FBQyxPQUFRLENBQUEsT0FBTyxDQUFDLFVBQVIsQ0FBZCxDQUFrQyxDQUFsQyxFQURKOztJQURtQjtXQUd2QixRQUFRLENBQUMsSUFBSSxDQUFDLGdCQUFkLENBQStCLE9BQS9CLEVBQXdDLEVBQUUsQ0FBQyxpQkFBM0M7RUFKRSxDQURxQjtFQU0zQixNQUFBLEVBQVEsU0FBQyxFQUFEO1dBQ0osUUFBUSxDQUFDLElBQUksQ0FBQyxtQkFBZCxDQUFrQyxPQUFsQyxFQUEyQyxFQUFFLENBQUMsaUJBQTlDO0VBREksQ0FObUI7Q0FBL0I7O0FBVUEsR0FBRyxDQUFDLE1BQUosQ0FBVyxRQUFYLEVBQXFCLFNBQUMsRUFBRDtBQUNqQixNQUFBO0VBQUEsRUFBQSxHQUFLLENBQUMsRUFBQSxHQUFLLElBQU4sQ0FBQSxHQUFjO0VBQ25CLE9BQUEsR0FBVSxFQUFBLEdBQUs7RUFDZixPQUFBLEdBQVUsQ0FBQyxDQUFDLEVBQUEsR0FBSyxFQUFOLENBQUEsR0FBWSxFQUFiLENBQUEsR0FBbUI7RUFDN0IsS0FBQSxHQUFRLENBQUMsRUFBQSxHQUFLLEVBQUwsR0FBVSxFQUFYLENBQUEsR0FBaUI7RUFDekIsSUFBRyxPQUFBLEdBQVUsRUFBYjtJQUNJLE9BQUEsR0FBVSxHQUFBLEdBQUksUUFEbEI7O0VBRUEsSUFBRyxPQUFBLEdBQVUsRUFBYjtJ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QUEsWUFBRCxJQUFpQjtRQUNqQixJQUFHLElBQUMsQ0FBQSxTQUFKO1VBQ0ksSUFBRyxJQUFDLENBQUEsWUFBRCxHQUFnQixFQUFoQixLQUFzQixDQUF6QjtZQUNJLElBQUMsQ0FBQSxTQUFELENBQUEsRUFESjs7VUFFQSxxQkFBQSxDQUFzQixJQUFDLENBQUEsSUFBdkIsRUFISjs7ZUFJQTtNQU5FLENBeEREO0tBYkw7R0FBUjtTQThFQTtBQS9FWSIsInNvdXJjZXNDb250ZW50IjpbIlZ1ZS5kaXJlY3RpdmUgJ2NsaWNrLW91dHNpZGUnLCB7XG4gICAgYmluZDogKGVsLCBiaW5kaW5nLCB2bm9kZSkgLT5cbiAgICAgICAgZWwuY2xpY2tPdXRzaWRlRXZlbnQgPSAoZSkgLT5cbiAgICAgICAgICAgIGlmIGVsICE9IGUudGFyZ2V0IG9yIG5vdCBlbC5jb250YWlucyBlLnRhcmdldFxuICAgICAgICAgICAgICAgIHZub2RlLmNvbnRleHRbYmluZGluZy5leHByZXNzaW9uXSBlXG4gICAgICAgIGRvY3VtZW50LmJvZHkuYWRkRXZlbnRMaXN0ZW5lciAnY2xpY2snLCBlbC5jbGlja091dHNpZGVFdmVudFxuICAgIHVuYmluZDogKGVsKSAtPlxuICAgICAgICBkb2N1bWVudC5ib2R5LnJlbW92ZUV2ZW50TGlzdGVuZXIgJ2NsaWNrJywgZWwuY2xpY2tPdXRzaWRlRXZlbnRcbn1cblxuVnVlLmZpbHRlciAnbWlsbGlzJywgKG1zKSAtPlxuICAgIG1zID0gKG1zICogLjAwMSkgfCAwXG4gICAgc2Vjb25kcyA9IG1zICUgNjBcbiAgICBtaW51dGVzID0gKChtcyAvIDYwKSAlIDYwKSB8IDBcbiAgICBob3VycyA9IChtcyAvIDYwIC8gNjApIHwgMFxuICAgIGlmIHNlY29uZHMgPCAxMFxuICAgICAgICBzZWNvbmRzID0gXCIwI3tzZWNvbmRzfVwiXG4gICAgaWYgbWludXRlcyA8IDEwXG4gICAgICAgIG1pbnV0ZXMgPSBcIjAje21pbnV0ZXN9XCJcbiAgICBcIiN7aG91cnN9OiN7bWludXRlc306I3tzZWNvbmRzfVwiXG5cblZ1ZS5maWx0ZXIgJ2xvY3RpbWUnLCAodHMpIC0+XG4gICAgbmV3IERhdGUodHMpLnRvTG9jYWxlU3RyaW5nICdydS1SVSdcblxuVElNRVRSQUNLRVIgPSB7XG4gICAgU2V0dGluZ3MgOiB7XG4gICAgICAgIGRhdGFTdG9yYWdlS2V5IDogJ3RpbWV0cmFja2VyLWRhdGEnXG4gICAgfVxuICAgIERhdGEgOiB7XG4gICAgICAgIGN1cnJlbnQgOiAnRGVmYXVsdCdcbiAgICAgICAgZGF0YSA6IHtcbiAgICAgICAgICAgICdEZWZhdWx0JyA6IFtdXG4gICAgICAgIH1cbiAgICB9XG59XG5cblZ1ZS5jb21wb25lbnQgJ3RpdGxlLXZpZXcnLCB7XG4gICAgdGVtcGxhdGU6ICcjdGl0bGUtdG1wbCdcbiAgICBwcm9wczogWydwcm9qZWN0cycsICdjdXJyZW50JywgJ3N0YXJ0RGF0ZSddXG4gICAgZGF0YTogLT5cbiAgICAgICAge1xuICAgICAgICAgICAgb3BlbmVkIDogZmFsc2VcbiAgICAgICAgICAgIHNlbGVjdGVkIDogQGN1cnJlbnRcbiAgICAgICAgfVxuICAgIGNvbXB1dGVkOiB7XG4gICAgICAgIHByb2plY3RUaXRsZXM6IC0+XG4gICAgICAgICAgICBfLmtleXMgQHByb2plY3RzXG4gICAgfVxuICAgIG1ldGhvZHM6IHtcbiAgICAgICAgdG9nZ2xlOiAtPlxuICAgICAgICAgICAgQG9wZW5lZCA9ICFAb3BlbmVkXG4gICAgICAgIG9uT3V0c2lkZTogLT5cbiAgICAgICAgICAgIEBvcGVuZWQgPSBmYWxzZVxuICAgICAgICBhZGQ6IC0+XG4gICAgICAgICAgICBpZiBAc3RhcnREYXRlXG4gICAgICAgICAgICAgICAgcmV0dXJuIGFsZXJ0ICfQndC10LvRjNC30Y8g0LTQvtCx0LDQstC40YLRjCDQv9GA0L7QtdC60YIg0L/QvtC60LAg0YDQsNCx0L7RgtCw0LXRgiDRgtCw0LnQvNC10YAnXG4gICAgICAgICAgICB0aXRsZSA9IHByb21wdCAn0JLQstC10LTQuNGC0LUg0L3QsNC30LLQsNC90LjQtSDQvdC+0LLQvtCz0L4g0L/RgNC+0LXQutGC0LA6J1xuICAgICAgICAgICAgdGl0bGUgPSB0aXRsZS5yZXBsYWNlIC8vL15cXHMrfFxccyskLy8vZywgJydcbiAgICAgICAgICAgIGlmIG5vdCB0aXRsZVxuICAgICAgICAgICAgICAgIHJldHVybiBhbGVydCAn0JLRiyDQvdC1INCy0LLQtdC70Lgg0L3QsNC30LLQsNC90LjQtSDQv9GA0L7QtdC60YLQsCdcbiAgICAgICAgICAgIGlmIHRpdGxlIGluIF8ua2V5cyBAcHJvamVjdHNcbiAgICAgICAgICAgICAgICByZXR1cm4gYWxlcnQgJ9Ci0LDQutC+0Lkg0L/RgNC+0LXQutGCINGD0LbQtSDRgdGD0YnQtdGB0YLQstGD0LXRgidcbiAgICAgICAgICAgIEBzZWxlY3RlZCA9IHRpdGxlXG4gICAgICAgICAgICBAJGVtaXQgJ2FkZDpwcm9qZWN0JywgdGl0bGVcbiAgICAgICAgcmVtb3ZlOiAtPlxuICAgICAgICAgICAgaWYgQHN0YXJ0RGF0ZVxuICAgICAgICAgICAgICAgIHJldHVybiBhbGVydCAn0J3QtdC70YzQt9GPINGD0LTQsNC70LjRgtGMINC/0YDQvtC10LrRgiDQv9C+0LrQsCDRgNCw0LHQvtGC0LDQtdGCINGC0LDQudC80LXRgCdcbiAgICAgICAgICAgIGlmIGNvbmZpcm0gJ9CS0Ysg0LTQtdC50YHRgtCy0LjRgtC10LvRjNC90L4g0YXQvtGC0LjRgtC1INCR0JXQl9CS0J7Ql9CS0KDQkNCi0J3QniDRg9C00LDQu9C40YLRjCDQv9GA0L7QtdC60YI/J1xuICAgICAgICAgICAgICAgIGlmIEBzZWxlY3RlZCA9PSAnRGVmYXVsdCdcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIGFsZXJ0ICfQndC10LvRjNC30Y8g0YPQtNCw0LvQuNGC0Ywg0L/RgNC+0LXQutGCIGBEZWZhdWx0YCdcbiAgICAgICAgICAgICAgICBAJGVtaXQgJ3JlbW92ZTpwcm9qZWN0JywgQHNlbGVjdGVkXG4gICAgICAgICAgICAgICAgQHNlbGVjdGVkID0gJ0RlZmF1bHQnXG4gICAgICAgIHNlbGVjdDogLT5cbiAgICAgICAgICAgIGlmIEBzdGFydERhdGVcbiAgICAgICAgICAgICAgICByZXR1cm4gYWxlcnQgJ9Cd0LXQu9GM0LfRjyDQtNC+0LHQsNCy0LjRgtGMINC/0YDQvtC10LrRgiDQv9C+0LrQsCDRgNCw0LHQvtGC0LDQtdGCINGC0LDQudC80LXRgCdcbiAgICAgICAgICAgIEAkZW1pdCAnY2hhbmdlOmN1cnJlbnQnLCBAc2VsZWN0ZWRcbiAgICB9XG59XG5cblZ1ZS5jb21wb25lbnQgJ3RpbWVyLXZpZXcnLCB7XG4gICAgdGVtcGxhdGU6ICcjdGltZXItdG1wbCdcbiAgICBwcm9wczogWydwcm9qZWN0cycsICdjdXJyZW50JywgJ3N0YXJ0RGF0ZSddXG4gICAgZGF0YTogLT5cbiAgICAgICAge1xuICAgICAgICAgICAgcnVubmluZzogZmFsc2VcbiAgICAgICAgfVxuICAgIGNvbXB1dGVkOiB7XG4gICAgICAgIHRpbWVzOiAtPlxuICAgICAgICAgICAgQHByb2plY3RzW0BjdXJyZW50XSBvciBbXVxuICAgICAgICB0b3RhbDogLT5cbiAgICAgICAgICAgIF8ucmVkdWNlIEB0aW1lcywgKHZhbCwgdGltZSkgLT5cbiAgICAgICAgICAgICAgICB2YWwgKyAodGltZS5lbmRUcyAtIHRpbWUuc3RhcnRUcylcbiAgICAgICAgICAgICwgMFxuICAgICAgICBvcGVuZWQ6IC0+XG4gICAgICAgICAgICBfLmNoYWluIEB0aW1lc1xuICAgICAgICAgICAgICAgIC5maWx0ZXIgKHRpbWUpIC0+IG5vdCB0aW1lLmNsb3NlZFxuICAgICAgICAgICAgICAgIC5yZWR1Y2UgKHZhbCwgdGltZSkgLT5cbiAgICAgICAgICAgICAgICAgICAgdmFsICsgKHRpbWUuZW5kVHMgLSB0aW1lLnN0YXJ0VHMpXG4gICAgICAgICAgICAgICAgLCAwXG4gICAgICAgICAgICAgICAgLnZhbHVlKClcbiAgICAgICAgdGltZTogLT5cbiAgICAgICAgICAgIGlmIEBzdGFydERhdGUgdGhlbiBuZXcgRGF0ZSgpLmdldFRpbWUoKSAtIEBzdGFydERhdGUuZ2V0VGltZSgpIGVsc2UgMFxuICAgIH1cbiAgICBtZXRob2RzOiB7XG4gICAgICAgIHRvZ2dsZTogLT5cbiAgICAgICAgICAgIEBydW5uaW5nID0gbm90IEBydW5uaW5nXG4gICAgICAgICAgICBAJGVtaXQgJ3RpbWVyOnRvZ2dsZScsIEBydW5uaW5nXG4gICAgfVxufVxuXG5WdWUuY29tcG9uZW50ICd0aW1lcy12aWV3Jywge1xuICAgIHRlbXBsYXRlOiAnI3RpbWVzLXRtcGwnXG4gICAgcHJvcHM6IFsncHJvamVjdHMnLCAnY3VycmVudCcsICdzdGFydERhdGUnXVxuICAgIGNvbXB1dGVkOiB7XG4gICAgICAgIHRpbWVzOiAtPlxuICAgICAgICAgICAgQHByb2plY3RzW0BjdXJyZW50XSBvciBbXVxuICAgICAgICBleGlzdDogLT5cbiAgICAgICAgICAgIEB0aW1lcy5sZW5ndGhcbiAgICB9XG4gICAgbWV0aG9kczoge1xuICAgICAgICBjbG9zZTogKHRpbWUpIC0+XG4gICAgICAgICAgICBAJGVtaXQgJ3RpbWVzOmNoYW5nZScsIF8ubWFwIEB0aW1lcywgKHQpIC0+XG4gICAgICAgICAgICAgICAgaWYgdC5zdGFydFRzID09IHRpbWUuc3RhcnRUcyBhbmQgdC5lbmRUcyA9PSB0aW1lLmVuZFRzXG4gICAgICAgICAgICAgICAgICAgIHQuY2xvc2VkID0gbm90IHQuY2xvc2VkXG4gICAgICAgICAgICAgICAgdFxuICAgICAgICByZW1vdmU6ICh0aW1lKSAtPlxuICAgICAgICAgICAgQCRlbWl0ICd0aW1lczpjaGFuZ2UnLCBfLmZpbHRlciBAdGltZXMsICh0KSAtPlxuICAgICAgICAgICAgICAgIHQuc3RhcnRUcyAhPSB0aW1lLnN0YXJ0VHMgYW5kIHQuZW5kVHMgIT0gdGltZS5lbmRUc1xuICAgIH1cbn1cblxuVnVlLmNvbXBvbmVudCAndGltZS12aWV3Jywge1xuICAgIHRlbXBsYXRlOiAnI3RpbWUtdG1wbCdcbiAgICBwcm9wczogWyd0aW1lJywgJ3N0YXJ0RGF0ZSddXG4gICAgZGF0YTogLT5cbiAgICAgICAge1xuICAgICAgICAgICAgY2xvc2VkOiBAdGltZS5jbG9zZWRcbiAgICAgICAgfVxuICAgIGNvbXB1dGVkOiB7XG4gICAgICAgIGRpZmY6IC0+XG4gICAgICAgICAgICBAdGltZS5lbmRUcyAtIEB0aW1lLnN0YXJ0VHNcbiAgICB9XG4gICAgbWV0aG9kczoge1xuICAgICAgICBjbG9zZTogLT5cbiAgICAgICAgICAgIGlmIEBzdGFydERhdGVcbiAgICAgICAgICAgICAgICByZXR1cm4gYWxlcnQgJ9Cd0LXQu9GM0LfRjyDRg9GH0LXRgdGC0Ywg0L/QvtC60LAg0YDQsNCx0L7RgtCw0LXRgiDRgtCw0LnQvNC10YAnXG4gICAgICAgICAgICBAJGVtaXQgJ3RpbWU6Y2xvc2UnLCBAdGltZVxuICAgICAgICByZW1vdmU6IC0+XG4gICAgICAgICAgICBpZiBAc3RhcnREYXRlXG4gICAgICAgICAgICAgICAgcmV0dXJuIGFsZXJ0ICfQndC10LvRjNC30Y8g0YPQtNCw0LvQuNGC0Ywg0L/QvtC60LAg0YDQsNCx0L7RgtCw0LXRgiDRgtCw0LnQvNC10YAnXG4gICAgICAgICAgICBpZiBjb25maXJtICfQlNC10LnRgdGC0LLQuNGC0LXQu9GM0L3QviDRhdC+0YLQuNGC0LUg0YPQtNCw0LvQuNGC0YxcXG7QsdC10Lcg0LLQvtC30LzQvtC20L3QvtGB0YLQuCDQstC+0YHRgdGC0LDQvdC+0LLQuNGC0Yw/J1xuICAgICAgICAgICAgICAgIEAkZW1pdCAndGltZTpyZW1vdmUnLCBAdGltZVxuICAgIH1cbn1cblxud2luZG93Lm9ubG9hZCA9IC0+XG4gICAgbmV3IFZ1ZSB7XG4gICAgICAgIGVsOiAnI2FwcC1jb250YWluZXInXG4gICAgICAgIHRlbXBsYXRlOiAnI2xheW91dC10bXBsJ1xuICAgICAgICBfbG9vcENvdW50ZXI6IDBcbiAgICAgICAgX2N1ckRlc2M6ICcnXG4gICAgICAgIGRhdGE6IC0+XG4gICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgcHJvamVjdHMgOiB7fVxuICAgICAgICAgICAgICAgIGN1cnJlbnQgOiAnRGVmYXVsdCdcbiAgICAgICAgICAgICAgICBzdGFydERhdGUgOiBudWxsXG4gICAgICAgICAgICB9XG4gICAgICAgIGNyZWF0ZWQ6IC0+XG4gICAgICAgICAgICBAbG9hZERhdGEoKVxuICAgICAgICBtZXRob2RzOiB7XG4gICAgICAgICAgICBsb2FkRGF0YTogLT5cbiAgICAgICAgICAgICAgICB0cnlcbiAgICAgICAgICAgICAgICAgICAgVElNRVRSQUNLRVIuRGF0YSA9IEpTT04ucGFyc2Uod2luZG93LmxvY2FsU3RvcmFnZS5nZXRJdGVtKFxuICAgICAgICAgICAgICAgICAgICAgICAgVElNRVRSQUNLRVIuU2V0dGluZ3MuZGF0YVN0b3JhZ2VLZXlcbiAgICAgICAgICAgICAgICAgICAgKSkgb3IgVElNRVRSQUNLRVIuRGF0YVxuICAgICAgICAgICAgICAgIGNhdGNoIGVyclxuICAgICAgICAgICAgICAgIEBwcm9qZWN0cyA9IFRJTUVUUkFDS0VSLkRhdGEuZGF0YVxuICAgICAgICAgICAgICAgIEBjdXJyZW50ID0gVElNRVRSQUNLRVIuRGF0YS5jdXJyZW50XG4gICAgICAgICAgICBzYXZlRGF0YTogLT5cbiAgICAgICAgICAgICAgICB3aW5kb3cubG9jYWxTdG9yYWdlLnNldEl0ZW0oXG4gICAgICAgICAgICAgICAgICAgIFRJTUVUUkFDS0VSLlNldHRpbmdzLmRhdGFTdG9yYWdlS2V5LFxuICAgICAgICAgICAgICAgICAgICBKU09OLnN0cmluZ2lmeSBUSU1FVFJBQ0tFUi5EYXRhXG4gICAgICAgICAgICAgICAgKVxuICAgICAgICAgICAgc2F2ZUFuZExvYWQ6IC0+XG4gICAgICAgICAgICAgICAgQHNhdmVEYXRhKClcbiAgICAgICAgICAgICAgICBAbG9hZERhdGEoKVxuICAgICAgICAgICAgY2hhbmdlQ3VycmVudDogKHZhbCkgLT5cbiAgICAgICAgICAgICAgICBUSU1FVFJBQ0tFUi5EYXRhLmN1cnJlbnQgPSB2YWxcbiAgICAgICAgICAgICAgICBAc2F2ZUFuZExvYWQoKVxuICAgICAgICAgICAgYWRkUHJvamVjdDogKHZhbCkgLT5cbiAgICAgICAgICAgICAgICBUSU1FVFJBQ0tFUi5EYXRhLmN1cnJlbnQgPSB2YWxcbiAgICAgICAgICAgICAgICBUSU1FVFJBQ0tFUi5EYXRhLmRhdGFbdmFsXSA9IFtdXG4gICAgICAgICAgICAgICAgQHNhdmVBbmRMb2FkKClcbiAgICAgICAgICAgIHJlbW92ZVByb2plY3Q6ICh2YWwpIC0+XG4gICAgICAgICAgICAgICAgVElNRVRSQUNLRVIuRGF0YS5jdXJyZW50ID0gJ0RlZmF1bHQnXG4gICAgICAgICAgICAgICAgZGVsZXRlIFRJTUVUUkFDS0VSLkRhdGEuZGF0YVt2YWxdXG4gICAgICAgICAgICAgICAgQHNhdmVBbmRMb2FkKClcbiAgICAgICAgICAgIHRpbWVzQ2hhbmdlOiAodGltZXMpIC0+XG4gICAgICAgICAgICAgICAgVElNRVRSQUNLRVIuRGF0YS5kYXRhW0BjdXJyZW50XSA9IHRpbWVzXG4gICAgICAgICAgICAgICAgQHNhdmVBbmRMb2FkKClcbiAgICAgICAgICAgIHNhdmVUaW1lcjogKGluc2VydD1mYWxzZSkgLT5cbiAgICAgICAgICAgICAgICB0aW1lcyA9IEBwcm9qZWN0c1tAY3VycmVudF1cbiAgICAgICAgICAgICAgICB0aW1lSXRlbSA9IHtcbiAgICAgICAgICAgICAgICAgICAgc3RhcnRUcyA6IEBzdGFydERhdGUuZ2V0VGltZSgpXG4gICAgICAgICAgICAgICAgICAgIGVuZFRzIDogbmV3IERhdGUoKS5nZXRUaW1lKClcbiAgICAgICAgICAgICAgICAgICAgZGVzYyA6IEBfY3VyRGVzY1xuICAgICAgICAgICAgICAgICAgICBjbG9zZWQgOiBmYWxzZVxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBpZiBpbnNlcnRcbiAgICAgICAgICAgICAgICAgICAgdGltZXMgPSBbdGltZUl0ZW0sIHRpbWVzLi4uXVxuICAgICAgICAgICAgICAgIGVsc2VcbiAgICAgICAgICAgICAgICAgICAgdGltZXMgPSBbdGltZUl0ZW0sIHRpbWVzWzEuLl0uLi5dXG4gICAgICAgICAgICAgICAgQHByb2plY3RzW0BjdXJyZW50XSA9IHRpbWVzXG4gICAgICAgICAgICAgICAgQHNhdmVBbmRMb2FkKClcbiAgICAgICAgICAgIHRpbWVyVG9nZ2xlOiAocnVubmluZykgLT5cbiAgICAgICAgICAgICAgICBpZiBydW5uaW5nXG4gICAgICAgICAgICAgICAgICAgIEBfbG9vcENvdW50ZXIgPSAwXG4gICAgICAgICAgICAgICAgICAgIEBzdGFydERhdGUgPSBuZXcgRGF0ZVxuICAgICAgICAgICAgICAgICAgICBAX2N1ckRlc2MgPSBwcm9tcHQoJ9Cc0L7QttC10YLQtSDQstCy0LXRgdGC0Lgg0L/QvtGP0YHQvdC10L3QuNC1OicpIG9yICcnXG4gICAgICAgICAgICAgICAgICAgIEBfY3VyRGVzYyA9IEBfY3VyRGVzYy5yZXBsYWNlIC8vL15cXHMrfFxccyskLy8vZywgJydcbiAgICAgICAgICAgICAgICAgICAgQHNhdmVUaW1lciB0cnVlXG4gICAgICAgICAgICAgICAgICAgIHdpbmRvdy5yZXF1ZXN0QW5pbWF0aW9uRnJhbWUgQGxvb3BcbiAgICAgICAgICAgICAgICBlbHNlXG4gICAgICAgICAgICAgICAgICAgIEBzYXZlVGltZXIoKVxuICAgICAgICAgICAgICAgICAgICBAc3RhcnREYXRlID0gbnVsbFxuICAgICAgICAgICAgbG9vcDogLT5cbiAgICAgICAgICAgICAgICBAX2xvb3BDb3VudGVyICs9IDFcbiAgICAgICAgICAgICAgICBpZiBAc3RhcnREYXRlXG4gICAgICAgICAgICAgICAgICAgIGlmIEBfbG9vcENvdW50ZXIgJSA2MCBpcyAwICMgcGVyIDEgc2Vjb25kc1xuICAgICAgICAgICAgICAgICAgICAgICAgQHNhdmVUaW1lcigpXG4gICAgICAgICAgICAgICAgICAgIHJlcXVlc3RBbmltYXRpb25GcmFtZSBAbG9vcFxuICAgICAgICAgICAgICAgIG51bGxcbiAgICAgICAgfVxuICAgIH1cbiAgICBudWxsXG4iXX0=
