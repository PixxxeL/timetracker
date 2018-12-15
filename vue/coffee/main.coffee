Vue.directive 'click-outside', {
    bind: (el, binding, vnode) ->
        el.clickOutsideEvent = (e) ->
            if el != e.target or not el.contains e.target
                vnode.context[binding.expression] e
        document.body.addEventListener 'click', el.clickOutsideEvent
    unbind: (el) ->
        document.body.removeEventListener 'click', el.clickOutsideEvent
}

Vue.filter 'millis', (ms) ->
    ms = (ms * .001) | 0
    seconds = ms % 60
    minutes = ((ms / 60) % 60) | 0
    hours = (ms / 60 / 60) | 0
    if seconds < 10
        seconds = "0#{seconds}"
    if minutes < 10
        minutes = "0#{minutes}"
    "#{hours}:#{minutes}:#{seconds}"

Vue.filter 'loctime', (ts) ->
    new Date(ts).toLocaleString 'ru-RU'

TIMETRACKER = {
    Settings : {
        dataStorageKey : 'timetracker-data'
    }
    Data : {
        current : 'Default'
        data : {
            'Default' : []
        }
    }
}

Vue.component 'title-view', {
    template: '#title-tmpl'
    props: ['projects', 'current', 'startDate']
    data: ->
        {
            opened : false
            selected : @current
        }
    computed: {
        projectTitles: ->
            _.keys @projects
    }
    methods: {
        toggle: ->
            @opened = !@opened
        onOutside: ->
            @opened = false
        add: ->
            if @startDate
                return alert 'Нельзя добавить проект пока работает таймер'
            title = prompt 'Введите название нового проекта:'
            title = title.replace ///^\s+|\s+$///g, ''
            if not title
                return alert 'Вы не ввели название проекта'
            if title in _.keys @projects
                return alert 'Такой проект уже существует'
            @selected = title
            @$emit 'add:project', title
        remove: ->
            if @startDate
                return alert 'Нельзя удалить проект пока работает таймер'
            if confirm 'Вы действительно хотите БЕЗВОЗВРАТНО удалить проект?'
                if @selected == 'Default'
                    return alert 'Нельзя удалить проект `Default`'
                @$emit 'remove:project', @selected
                @selected = 'Default'
        select: ->
            if @startDate
                return alert 'Нельзя добавить проект пока работает таймер'
            @$emit 'change:current', @selected
    }
}

Vue.component 'timer-view', {
    template: '#timer-tmpl'
    props: ['projects', 'current', 'startDate']
    data: ->
        {
            running: false
        }
    computed: {
        times: ->
            @projects[@current] or []
        total: ->
            _.reduce @times, (val, time) ->
                val + (time.endTs - time.startTs)
            , 0
        opened: ->
            _.chain @times
                .filter (time) -> not time.closed
                .reduce (val, time) ->
                    val + (time.endTs - time.startTs)
                , 0
                .value()
        time: ->
            if @startDate then new Date().getTime() - @startDate.getTime() else 0
    }
    methods: {
        toggle: ->
            @running = not @running
            @$emit 'timer:toggle', @running
    }
}

Vue.component 'times-view', {
    template: '#times-tmpl'
    props: ['projects', 'current', 'startDate']
    computed: {
        times: ->
            @projects[@current] or []
        exist: ->
            @times.length
    }
    methods: {
        close: (time) ->
            @$emit 'times:change', _.map @times, (t) ->
                if t.startTs == time.startTs and t.endTs == time.endTs
                    t.closed = not t.closed
                t
        remove: (time) ->
            @$emit 'times:change', _.filter @times, (t) ->
                t.startTs != time.startTs and t.endTs != time.endTs
    }
}

Vue.component 'time-view', {
    template: '#time-tmpl'
    props: ['time', 'startDate']
    data: ->
        {
            closed: @time.closed
        }
    computed: {
        diff: ->
            @time.endTs - @time.startTs
    }
    methods: {
        close: ->
            if @startDate
                return alert 'Нельзя учесть пока работает таймер'
            @$emit 'time:close', @time
        remove: ->
            if @startDate
                return alert 'Нельзя удалить пока работает таймер'
            if confirm 'Действительно хотите удалить\nбез возможности восстановить?'
                @$emit 'time:remove', @time
    }
}

window.onload = ->
    new Vue {
        el: '#app-container'
        template: '#layout-tmpl'
        _loopCounter: 0
        _curDesc: ''
        data: ->
            {
                projects : {}
                current : 'Default'
                startDate : null
            }
        created: ->
            @loadData()
        methods: {
            loadData: ->
                try
                    TIMETRACKER.Data = JSON.parse(window.localStorage.getItem(
                        TIMETRACKER.Settings.dataStorageKey
                    )) or TIMETRACKER.Data
                catch err
                @projects = TIMETRACKER.Data.data
                @current = TIMETRACKER.Data.current
            saveData: ->
                window.localStorage.setItem(
                    TIMETRACKER.Settings.dataStorageKey,
                    JSON.stringify TIMETRACKER.Data
                )
            saveAndLoad: ->
                @saveData()
                @loadData()
            changeCurrent: (val) ->
                TIMETRACKER.Data.current = val
                @saveAndLoad()
            addProject: (val) ->
                TIMETRACKER.Data.current = val
                TIMETRACKER.Data.data[val] = []
                @saveAndLoad()
            removeProject: (val) ->
                TIMETRACKER.Data.current = 'Default'
                delete TIMETRACKER.Data.data[val]
                @saveAndLoad()
            timesChange: (times) ->
                TIMETRACKER.Data.data[@current] = times
                @saveAndLoad()
            saveTimer: (insert=false) ->
                times = @projects[@current]
                timeItem = {
                    startTs : @startDate.getTime()
                    endTs : new Date().getTime()
                    desc : @_curDesc
                    closed : false
                }
                if insert
                    times = [timeItem, times...]
                else
                    times = [timeItem, times[1..]...]
                @projects[@current] = times
                @saveAndLoad()
            timerToggle: (running) ->
                if running
                    @_loopCounter = 0
                    @startDate = new Date
                    @_curDesc = prompt('Можете ввести пояснение:') or ''
                    @_curDesc = @_curDesc.replace ///^\s+|\s+$///g, ''
                    @saveTimer true
                    window.requestAnimationFrame @loop
                else
                    @saveTimer()
                    @startDate = null
            loop: ->
                @_loopCounter += 1
                if @startDate
                    if @_loopCounter % 60 is 0 # per 1 seconds
                        @saveTimer()
                    requestAnimationFrame @loop
                null
        }
    }
    null
