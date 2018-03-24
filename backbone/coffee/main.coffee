
TIMETRACKER = {

    Settings : {
        dataStorageKey : 'timetracker-data'
    }

    DefaultData : ->
        {
            current : 'Default'
            data : {
                'Default' : []
            }
        }

    Data : {}

    formatMilliseconds : (ms) ->
        ms = (ms * .001) | 0
        seconds = ms % 60
        minutes = ((ms / 60) % 60) | 0
        hours = (ms / 60 / 60) | 0
        if seconds < 10
            seconds = "0#{seconds}"
        if minutes < 10
            minutes = "0#{minutes}"
        "#{hours}:#{minutes}:#{seconds}"

    toggleProjectSelectList : ->
        $('.swap-project').toggle()
        $('.select-project').toggle()
        null

}


Backbone.sync = (method, model, options={}) ->
    #console.log method, model, options
    switch method
        when 'read'
            data = localStorage.getItem TIMETRACKER.Settings.dataStorageKey
            if data
                data = JSON.parse data
                #console.log data
            data = data or TIMETRACKER.DefaultData()
            resp = _.map data.data, (times, project) ->
                {
                    name : project
                    current : project == data.current
                    times : new TIMETRACKER.TimesCollection(times)
                }
        when 'create', 'update', 'delete'
            data = TIMETRACKER.DefaultData()
            TIMETRACKER.Data.each (project) ->
                if project.get('current')
                    data.current = project.get('name')
                data.data[project.get('name')] = project.get('times').toJSON()
            localStorage.setItem TIMETRACKER.Settings.dataStorageKey, JSON.stringify data
            if model instanceof TIMETRACKER.ProjectsCollection
                resp = TIMETRACKER.Data.map (project) ->
                    project.toJSON()
    #console.log resp, options
    if resp and options.success
        options.success.call model, resp, options


TIMETRACKER.TimeModel = Backbone.Model.extend {

    defaults : {
        closed : false
    }

    start : ->
        new Date(@get 'startTs').toLocaleString 'ru-RU'

    end : ->
        new Date(@get 'endTs').toLocaleString 'ru-RU'

    diff : ->
        @get('endTs') - @get('startTs')

    diffMs : ->
        TIMETRACKER.formatMilliseconds @diff()

    closedCls : ->
        if @get 'closed' then 'closed' else ''

    hiddenCls : ->
        [@closedCls(), 'm-hidden'].join ' '

    asDict : ->
        {
            checked : if @get 'closed' then 'checked' else ''
            desc : @get 'desc'
            start : @start()
            end : @end()
            diff : @diff()
            diffMs : @diffMs()
            closedCls : @closedCls()
            hiddenCls : @hiddenCls()
        }
}


TIMETRACKER.TimesCollection = Backbone.Collection.extend {
    model : TIMETRACKER.TimeModel
}


TIMETRACKER.TimeView = Backbone.View.extend {

    tagName : 'tr'

    template : _.template $('#time-row-tmpl').html()

    events : {
        'click .clear-btn' : 'removeTime'
        'click .closer'    : 'closeTime'
    }

    initialize : ->
        _.bindAll @, 'render', 'removeTime', 'closeTime', 'remove'
        @model.bind 'change', @render
        @model.bind 'destroy', @remove

    removeTime : (e) ->
        e.preventDefault()
        if $('#content-wrapper').hasClass 'lock'
            return alert 'Нельзя удалить время пока работает таймер'
        @model.destroy()
        @trigger 'destroy:time'
        null

    closeTime : (e) ->
        e.preventDefault()
        if $('#content-wrapper').hasClass 'lock'
            return alert 'Нельзя переключить время пока работает таймер'
        @model.set('closed', !@model.get 'closed').save()
        @trigger 'update:time'
        null

    render : ->
        @$el.html @template @model.asDict()
        @

    remove : ->
        @off()
        @$el.remove()
}


TIMETRACKER.TimesView = Backbone.View.extend {

    el : $ '.times'

    initialize : ->
        _.bindAll @, 'render', 'currentTimes', 'addOneTime'
        @currentTimes()
        @collection.bind 'remove', ->
            Backbone.sync 'update', @collection

    render : ->
        @currentTimes()
        if @collection.length
            @$el.find('.results').show().find('tbody').empty()
            @$el.find('.empty').hide()
            @collection.each @addOneTime
        else
            @$el.find('.results').hide()
            @$el.find('.empty').show()
        @

    addOneTime : (time) ->
        timesView = @
        view = new TIMETRACKER.TimeView {model: time}
        view.on 'destroy:time update:time', ->
            timesView.trigger 'update:times'
        @$el.find('.results tbody').append view.render().$el
        null

    currentTimes : ->
        @collection = TIMETRACKER.Data.findWhere({current:true}).get('times')
}


TIMETRACKER.ProjectModel = Backbone.Model.extend {
    defaults : {
        current : false
        times : []
    }

    asDict : ->
        {
            selected : if @get 'current' then 'selected' else ''
            name : @get 'name'
        }
}


TIMETRACKER.ProjectsCollection = Backbone.Collection.extend {
    model : TIMETRACKER.ProjectModel
}


TIMETRACKER.ProjectView = Backbone.View.extend {

    tagName : 'option'

    initialize : ->
        _.bindAll @, 'render'

    render : ->
        name = @model.get 'name'
        @$el.text(name).val(name).attr 'selected', @model.get 'current'
        @
}


TIMETRACKER.ProjectsView = Backbone.View.extend {

    el : $ 'select.select-project'

    events : {
        'change' : 'selectProject'
        'click'  : 'clickSelectProject'
    }

    initialize : ->
        _.bindAll @, 'render', 'addOneProject', 'selectProject', 'clickSelectProject'
        @collection = TIMETRACKER.Data

    render : ->
        @$el.empty()
        if @collection.length
            @collection.each @addOneProject
        @

    addOneProject : (project) ->
        view = new TIMETRACKER.ProjectView {model: project}
        @$el.append view.render().$el
        null

    selectProject : (e) ->
        if $('#content-wrapper').hasClass 'lock'
            return alert 'Нельзя выбрать проект пока работает таймер'
        value = @$el.val()
        collection = @collection
        collection.forEach (model) ->
            model.set 'current', value == model.get 'name'
        collection.trigger 'toggle'
        TIMETRACKER.toggleProjectSelectList()
        null

    clickSelectProject : (e) ->
        e.stopPropagation()
        if $('#content-wrapper').hasClass 'lock'
            return alert 'Нельзя, пока работает таймер'
        null

}


TIMETRACKER.TitleView = Backbone.View.extend {

    el : $ '.title-container'

    events : {
        'click   .swap-project' : 'swapProject'
        'click    .add-project' : 'addProject'
        'click .remove-project' : 'removeProject'
    }

    initialize : ->
        _.bindAll @, 'render', 'swapProject', 'addProject', 'removeProject',
            'closeSelectProject'
        $(window).on 'click', @closeSelectProject
        @collection = TIMETRACKER.Data
        @projectsView = new TIMETRACKER.ProjectsView()

    render : ->
        current = TIMETRACKER.Data.findWhere {current:true}
        @$el.find('.project-name').text " — #{current.get('name')}"
        @projectsView.render()
        @

    swapProject : (e) ->
        e.preventDefault()
        e.stopPropagation()
        if $('#content-wrapper').hasClass 'lock'
            return alert 'Нельзя переключить проект пока работает таймер'
        TIMETRACKER.toggleProjectSelectList()
        null

    addProject : (e) ->
        e.preventDefault()
        if $('#content-wrapper').hasClass 'lock'
            return alert 'Нельзя добавить проект пока работает таймер'
        title = prompt 'Введите название нового проекта:'
        title = $.trim(title or '')
        if not title
            return alert 'Вы не ввели название проекта'
        if @collection.pluck('name').indexOf(title) != -1
            return alert 'Такой проект уже существует'
        @collection.forEach (model) ->
            model.set 'current', false
        @collection.add {
            name : title
            current : true
            times : new TIMETRACKER.TimesCollection
        }
        @collection.trigger 'toggle'
        null

    removeProject : (e) ->
        e.preventDefault()
        if $('#content-wrapper').hasClass 'lock'
            return alert 'Нельзя удалить проект пока работает таймер'
        if not confirm 'Вы действительно хотите БЕЗВОЗВРАТНО удалить проект?'
            return
        current = @collection.findWhere({current:true})
        if 'Default' == current.get 'name'
            return alert 'Нельзя удалить проект `Default`'
        @collection.remove current
        @collection.forEach (model) ->
            model.set 'current', 'Default' == model.get 'name'
        @collection.trigger 'toggle'
        null

    closeSelectProject : (e) ->
        e.stopPropagation()
        if $('.select-project').is(':visible') and not $(e.target).hasClass('select-project')
            TIMETRACKER.toggleProjectSelectList()
        null

}


TIMETRACKER.TimerView = Backbone.View.extend {

    el : $ '.timer-container'

    events : {
        'click a.label' : 'toggleTimer'
        'click a.btn'   : 'toggleTimer'
    }

    initialize : ->
        @calcTotal()
        @model = null
        @timerEl = @$el.find 'a.label'
        @btnEl = @$el.find 'i.fa'
        @totalEl = @$el.find('.total-time .total.value').text TIMETRACKER.formatMilliseconds(@total)
        @openedEl = @$el.find('.total-time .opened.value').text TIMETRACKER.formatMilliseconds(@opened)
        _.bindAll @, 'render', 'toggleTimer', 'syncCollection', 'calcTotal'

    render : ->
        @loopCounter += 1
        format = TIMETRACKER.formatMilliseconds
        if @model
            endTs = new Date().getTime()
            diff = endTs - @model.get 'startTs'
            @timerEl.text format(diff)
            @totalEl.text format(diff + @total)
            @openedEl.text format(diff + @opened)
            #if @loopCounter % 100 is 0 # per 5 seconds
            #    @model.set 'endTs', endTs
            @model.set 'endTs', endTs
            requestAnimationFrame @render
        else
            @calcTotal()
            @totalEl.text format(@total)
            @openedEl.text format(@opened)
        @

    toggleTimer : (e) ->
        e.preventDefault()
        $('#content-wrapper').toggleClass 'lock'
        if @model
            @btnEl.removeClass('fa-pause').addClass('fa-play')
            @model.unbind 'change', @syncCollection
            @model = null
        else
            @btnEl.removeClass('fa-play').addClass('fa-pause')
            @loopCounter = 0
            ts = new Date().getTime()
            @model = new TIMETRACKER.TimeModel {
                startTs : ts,
                endTs : ts,
                desc : (prompt('Можете ввести пояснение:') || '').trim(),
            }
            @model.bind 'change', @syncCollection
            @collection = TIMETRACKER.Data.findWhere({current:true})
            @collection.get('times').unshift @model
            requestAnimationFrame @render
        @trigger 'update:periodic'
        null

    syncCollection : () ->
        if @model
            Backbone.sync 'update', TIMETRACKER.Data

    calcTotal : ->
        @collection = TIMETRACKER.Data.findWhere({current:true})
        @total = @collection.get('times').reduce((prev, model) ->
            prev + model.diff()
        , 0)
        @opened = @collection.get('times').reduce((prev, model) ->
            prev + (if model.get 'closed' then 0 else model.diff())
        , 0)

}


TIMETRACKER.AppView = Backbone.View.extend {

    id : 'content-wrapper'

    initialize : ->
        _.bindAll @, 'render'
        TIMETRACKER.Data = new TIMETRACKER.ProjectsCollection()
        TIMETRACKER.Data.fetch()
        TIMETRACKER.Data.on 'toggle', ->
            Backbone.sync 'update', TIMETRACKER.Data, {
                success : @render
            }
        , @
        @titleView = new TIMETRACKER.TitleView()
        @timerView = new TIMETRACKER.TimerView()
        @timesView = new TIMETRACKER.TimesView()
        @timesView.on 'update:times', @timerView.render
        @timerView.on 'update:periodic', @timesView.render
        @render()

    render : ->
        @titleView.render()
        @timerView.render()
        @timesView.render()
        @

}


window.onload = ->
    new TIMETRACKER.AppView()
