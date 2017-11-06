var TIMETRACKER, formatMilliseconds;

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

formatMilliseconds = function(ms) {
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
};

TIMETRACKER.AppViewModel = function() {
  var bindEvents, load, newTimeSave, renderFrame, save, self;
  self = this;
  self.loopCounter = 0;
  self.data = ko.observable(TIMETRACKER.Data.data);
  self.titles = ko.computed(function() {
    return _.keys(self.data());
  });
  self.current = ko.observable(TIMETRACKER.Data.current);
  self.isSelectProject = ko.observable(false);
  self.isToggleProject = ko.computed(function() {
    return self.titles().length > 1;
  });
  self.diff = ko.observable(0);
  self.currentTimes = ko.computed(function() {
    return self.data()[self.current()] || [];
  });
  self.currentTimesSize = ko.computed(function() {
    return self.currentTimes().length;
  });
  self.totalTime = ko.computed(function() {
    return _.reduce(self.currentTimes(), function(memo, time) {
      return memo + (time.endTs - time.startTs);
    }, 0);
  });
  self.closedTime = ko.computed(function() {
    return _.reduce(self.currentTimes(), function(memo, time) {
      var diff;
      diff = time.closed ? 0 : time.endTs - time.startTs;
      return memo + diff;
    }, 0);
  });
  self.newTime = ko.observable(null);
  load = function() {
    var data;
    data = window.localStorage.getItem(TIMETRACKER.Settings.dataStorageKey);
    if (data) {
      data = JSON.parse(data);
      self.data(data.data);
      self.current(data.current);
    }
    return null;
  };
  save = function() {
    var data;
    data = JSON.stringify({
      current: self.current(),
      data: self.data()
    });
    window.localStorage.setItem(TIMETRACKER.Settings.dataStorageKey, data);
    return null;
  };
  bindEvents = function() {
    document.addEventListener('mouseup', function(e) {
      var button, select;
      select = document.querySelector('select.select-project');
      button = document.querySelector('a.swap-project');
      if (!select.contains(e.target) && !button.contains(e.target)) {
        return self.isSelectProject(false);
      }
    });
    return null;
  };
  renderFrame = function() {
    if (self.newTime() === null) {
      return;
    }
    self.newTime().endTs = new Date().getTime();
    self.diff(self.newTime().endTs - self.newTime().startTs);
    self.loopCounter += 1;
    if (self.loopCounter % 30 === 0) {
      newTimeSave();
    }
    return window.requestAnimationFrame(renderFrame);
  };
  newTimeSave = function() {
    var idx, times;
    times = self.currentTimes();
    idx = _.findIndex(times, function(time) {
      return time.startTs === self.newTime().startTs;
    });
    if (idx < 0) {
      times.unshift(self.newTime());
    } else {
      times[idx] = self.newTime();
    }
    save();
    return load();
  };
  self.formatMilliseconds = formatMilliseconds;
  self.selectProjectClick = function(e) {
    e.stopPropagation;
    return null;
  };
  self.selectProjectChange = save;
  self.toggleSelectProject = function() {
    if (self.isToggleProject()) {
      self.isSelectProject(!self.isSelectProject());
    }
    return null;
  };
  self.addProject = function() {
    var data, title;
    if (self.newTime() !== null) {
      return window.alert('Нельзя добавить проект пока работает таймер');
    }
    title = window.prompt('Введите название нового проекта:', '');
    if (title) {
      title = title.trim();
    }
    if (title === null) {
      return;
    }
    if (!title) {
      return window.alert('Вы не ввели название проекта');
    }
    if (self.titles().indexOf(title) !== -1) {
      return window.alert('Такой проект уже существует');
    }
    data = self.data();
    data[title] = [];
    self.data(data);
    self.current(title);
    save();
    return null;
  };
  self.removeProject = function() {
    var data;
    if (self.newTime() !== null) {
      return window.alert('Нельзя удалить проект пока работает таймер');
    }
    if (window.confirm('Вы действительно хотите БЕЗВОЗВРАТНО удалить проект?')) {
      if (self.current() === 'Default') {
        return window.alert('Нельзя удалить проект `Default`');
      }
      data = self.data();
      delete data[self.current()];
      self.data(data);
      self.current('Default');
      save();
    }
    return null;
  };
  self.toggleTimer = function() {
    var now;
    if (self.newTime() === null) {
      self.loopCounter = 0;
      now = new Date().getTime();
      self.newTime({
        startTs: now,
        endTs: now,
        desc: window.prompt('Можете ввести пояснение:', '').trim(),
        closed: false
      });
      newTimeSave();
      window.requestAnimationFrame(renderFrame);
    } else {
      newTimeSave();
      self.newTime(null);
      self.diff(0);
    }
    return null;
  };
  self.closeTime = function(time) {
    if (self.newTime() !== null) {
      return window.alert('Нельзя учесть пока работает таймер');
    }
    _.find(self.currentTimes(), function(item) {
      if (item.startTs === time.startTs()) {
        item.closed = time.closed();
      }
    });
    save();
    return load();
  };
  self.removeTime = function(time) {
    if (self.newTime() !== null) {
      return window.alert('Нельзя удалить пока работает таймер');
    }
    if (!confirm('Действительно хотите удалить\nбез возможности восстановить?')) {
      return;
    }
    self.data()[self.current()] = _.reject(self.currentTimes(), function(item) {
      return item.startTs === time.startTs();
    });
    save();
    load();
    return null;
  };
  load();
  bindEvents();
  return self;
};

TIMETRACKER.TimeViewModel = function(params) {
  var app, self;
  self = this;
  app = params.app;
  self.startTs = ko.observable(params.item.startTs);
  self.endTs = ko.observable(params.item.endTs);
  self.desc = ko.observable(params.item.desc);
  self.closed = ko.observable(params.item.closed);
  self.diff = ko.computed(function() {
    return formatMilliseconds(self.endTs() - self.startTs());
  });
  self.start = ko.computed(function() {
    return new Date(self.startTs()).toLocaleString('ru-RU');
  });
  self.end = ko.computed(function() {
    return new Date(self.endTs()).toLocaleString('ru-RU');
  });
  self.closed.subscribe(function() {
    return app.closeTime(self);
  });
  self.remove = function() {
    return app.removeTime(self);
  };
  return self;
};

ko.components.register('time-row', {
  viewModel: TIMETRACKER.TimeViewModel,
  template: {
    element: 'time-row-tmpl'
  }
});

window.onload = function() {
  return ko.applyBindings(new TIMETRACKER.AppViewModel(), document.getElementById('content-wrapper'));
};
