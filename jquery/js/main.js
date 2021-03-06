"TODO:\n    1. Переименование проекта\n    2. При удалении переключать не на дефолтный а на существующий\n    3. Минификация и склейка js и css";
var TIMETRACKER;

TIMETRACKER = {
  Settings: {
    dataStorageKey: 'timetracker-data'
  },
  Data: {}
};

TIMETRACKER.App = function() {
  var curDesc, formatMilliseconds, load, loopCounter, renderFrame, renderProjectSelectList, renderResults, save, saveTimer, setProject, startDate, timerEl, titles, toggleEl, toggleProjectSelectList, toggleTimer;
  timerEl = $('.timer-container a.label');
  toggleEl = $('.timer-container a.btn');
  startDate = null;
  curDesc = '';
  titles = [];
  loopCounter = 0;
  load = function() {
    var data;
    data = localStorage.getItem(TIMETRACKER.Settings.dataStorageKey);
    if (data) {
      TIMETRACKER.Data = JSON.parse(data);
    }
    return null;
  };
  save = function() {
    var data;
    data = JSON.stringify(TIMETRACKER.Data);
    localStorage.setItem(TIMETRACKER.Settings.dataStorageKey, data);
    return null;
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
  renderFrame = function() {
    var diff;
    loopCounter += 1;
    if (startDate) {
      diff = new Date().getTime() - startDate.getTime();
      timerEl.text(formatMilliseconds(diff));
      if (loopCounter % 100 === 0) {
        saveTimer();
      }
      requestAnimationFrame(renderFrame);
    }
    return null;
  };
  renderResults = function() {
    var html, opened, total, total_container;
    total = 0;
    opened = 0;
    if (TIMETRACKER.Data.data[TIMETRACKER.Data.current].length) {
      html = '';
      $.each(TIMETRACKER.Data.data[TIMETRACKER.Data.current], function() {
        var checked, closed, diff, end, hidden, start;
        start = new Date(this.startTs).toLocaleString();
        end = new Date(this.endTs).toLocaleString();
        diff = this.endTs - this.startTs;
        if (this.closed) {
          checked = 'checked';
          closed = 'class="closed"';
          hidden = 'class="m-hidden closed"';
        } else {
          checked = '';
          closed = '';
          hidden = 'class="m-hidden"';
          opened += diff;
        }
        html += "<tr data-start=\"" + this.startTs + "\" data-end=\"" + this.endTs + "\">\n    <td><input type=\"checkbox\" class=\"closer\" " + checked + "></td>\n    <td " + closed + ">" + start + "</td>\n    <td " + closed + ">" + end + "</td>\n    <td " + hidden + ">" + this.desc + "</td>\n    <td " + closed + ">" + (formatMilliseconds(diff)) + "</td>\n    <td><a href=\"#\" class=\"clear-btn\" title=\"Удалить\"><i class=\"fa fa-remove\"></i></a></td>\n</tr>";
        return total += diff;
      });
      $('.times').find('.empty').hide().end().find('.results').show().find('tbody').html(html);
    } else {
      $('.times').find('.empty').show().end().find('.results').hide();
    }
    total_container = $('.timer-container .total-time');
    total_container.find('.value.total').text(formatMilliseconds(total));
    total_container.find('.value.opened').text(formatMilliseconds(opened));
    return null;
  };
  renderProjectSelectList = function() {
    $('.select-project').empty();
    $.each(TIMETRACKER.Data.data, function(title, item) {
      var selected;
      selected = title === TIMETRACKER.Data.current ? ' selected' : '';
      $('.select-project').append("<option value=\"" + title + "\"" + selected + ">" + title + "</option>");
      return titles.push(title);
    });
    if (titles.length < 2) {
      return $('.swap-project').hide();
    } else {
      return $('.swap-project').show();
    }
  };
  saveTimer = function(insert) {
    var startTs, timeItem, times;
    if (insert == null) {
      insert = false;
    }
    times = TIMETRACKER.Data.data[TIMETRACKER.Data.current];
    startTs = startDate.getTime();
    timeItem = {
      startTs: startTs,
      endTs: new Date().getTime(),
      desc: curDesc,
      closed: false
    };
    if (insert) {
      times.unshift(timeItem);
    } else {
      $.each(times, function(idx, item) {
        if (item.startTs === startTs) {
          times[idx] = timeItem;
        }
        return null;
      });
    }
    save();
    return renderResults();
  };
  toggleTimer = function(e) {
    e.preventDefault();
    $('#content-wrapper').toggleClass('lock');
    if (startDate) {
      toggleEl.find('i.fa').removeClass('fa-pause').addClass('fa-play');
      saveTimer();
      startDate = null;
    } else {
      toggleEl.find('i.fa').removeClass('fa-play').addClass('fa-pause');
      loopCounter = 0;
      startDate = new Date;
      curDesc = prompt('Можете ввести пояснение:');
      curDesc = $.trim(curDesc);
      saveTimer(true);
      requestAnimationFrame(renderFrame);
    }
    return null;
  };
  setProject = function() {
    if (!TIMETRACKER.Data.current) {
      TIMETRACKER.Data.current = 'Default';
      TIMETRACKER.Data.data = {
        'Default': []
      };
    }
    $('.title-container .project-name').text(" — " + TIMETRACKER.Data.current);
    renderResults();
    return null;
  };
  toggleProjectSelectList = function() {
    $('.swap-project').toggle();
    $('.select-project').toggle();
    return null;
  };
  timerEl.on('click', toggleTimer);
  toggleEl.on('click', toggleTimer);
  $('.times .results').on('click', '.clear-btn', function(e) {
    var end, removed, start, tr;
    e.preventDefault();
    if (startDate) {
      return alert('Нельзя удалить пока работает таймер');
    }
    tr = $(this).parents('tr');
    start = parseFloat(tr.data('start'));
    end = parseFloat(tr.data('end'));
    if (confirm('Действительно хотите удалить\nбез возможности восстановить?')) {
      removed = -1;
      $.each(TIMETRACKER.Data.data[TIMETRACKER.Data.current], function(idx, item) {
        if (item.startTs === start && item.endTs === end) {
          return removed = idx;
        }
      });
      if (removed !== -1) {
        TIMETRACKER.Data.data[TIMETRACKER.Data.current].splice(removed, 1);
        save();
        renderResults();
      }
    }
    return null;
  });
  $('.times .results').on('change', '.closer', function(e) {
    var closed, end, item, start, tr;
    e.preventDefault();
    if (startDate) {
      return alert('Нельзя учесть пока работает таймер');
    }
    tr = $(this).parents('tr');
    start = parseFloat(tr.data('start'));
    end = parseFloat(tr.data('end'));
    closed = -1;
    $.each(TIMETRACKER.Data.data[TIMETRACKER.Data.current], function(idx, item) {
      if (item.startTs === start && item.endTs === end) {
        return closed = idx;
      }
    });
    if (closed !== -1) {
      item = TIMETRACKER.Data.data[TIMETRACKER.Data.current][closed];
      item.closed = !item.closed;
      save();
      renderResults();
    }
    return null;
  });
  $('.swap-project').on('click', function(e) {
    e.preventDefault();
    e.stopPropagation();
    if (startDate) {
      return alert('Нельзя переключить пока работает таймер');
    }
    toggleProjectSelectList();
    return null;
  });
  $('.select-project').on('change', function() {
    TIMETRACKER.Data.current = $(this).val();
    save();
    setProject();
    toggleProjectSelectList();
    return null;
  }).on('click', function(e) {
    e.stopPropagation();
    return null;
  });
  $('.add-project').on('click', function(e) {
    var title;
    e.preventDefault();
    if (startDate) {
      return alert('Нельзя добавить проект пока работает таймер');
    }
    title = prompt('Введите название нового проекта:');
    title = $.trim(title);
    if (!title) {
      return alert('Вы не ввели название проекта');
    }
    if ($.inArray(title, titles) !== -1) {
      return alert('Такой проект уже существует');
    }
    TIMETRACKER.Data.current = title;
    TIMETRACKER.Data.data[title] = [];
    save();
    renderProjectSelectList();
    setProject();
    return null;
  });
  $('.remove-project').on('click', function(e) {
    e.preventDefault();
    if (startDate) {
      return alert('Нельзя удалить проект пока работает таймер');
    }
    if (confirm('Вы действительно хотите БЕЗВОЗВРАТНО удалить проект?')) {
      if (TIMETRACKER.Data.current === 'Default') {
        return alert('Нельзя удалить проект `Default`');
      }
      delete TIMETRACKER.Data.data[TIMETRACKER.Data.current];
      TIMETRACKER.Data.current = 'Default';
      save();
      renderProjectSelectList();
      setProject();
    }
    return null;
  });
  $(window).on('click', function(e) {
    if ($('.select-project').is(':visible') && !$(e.target).hasClass('select-project')) {
      toggleProjectSelectList();
    }
    return null;
  });
  load();
  renderProjectSelectList();
  return setProject();
};

$(function() {
  new TIMETRACKER.App();
  return null;
});
