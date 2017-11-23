
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
            #resp = TIMETRACKER.Data
    if resp and options.success
        options.success.call model, resp, options
    else if options.error
        options.error 'Sync error'
    else
        console.error 'Sync error'


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
        @model.destroy()
        null

    closeTime : (e) ->
        e.preventDefault()
        @model.set('closed', !@model.get 'closed').save()
        null

    render : ->
        @$el.html @template @model.asDict()
        @

    remove : ->
        @$el.remove()
}


TIMETRACKER.TimesView = Backbone.View.extend {

    el : $ '.times'

    initialize : ->
        _.bindAll @, 'render', 'addOneTime'
        @collection = TIMETRACKER.Data.findWhere({current:true}).get('times')
        @collection.bind 'remove', ->
            Backbone.sync 'update', @collection

    render : ->
        if @collection.length
            @$el.find('.results').show().find('tbody').empty()
            @$el.find('.empty').hide()
            @collection.each @addOneTime
        else
            @$el.find('.results').hide()
            @$el.find('.empty').show()
        @

    addOneTime : (time) ->
        view = new TIMETRACKER.TimeView {model: time}
        @$el.find('.results tbody').append view.render().$el
        null
}


TIMETRACKER.ProjectModel = Backbone.Model.extend {
    defaults : {
        current : false
        times : []
    }
}


TIMETRACKER.ProjectsCollection = Backbone.Collection.extend {
    model : TIMETRACKER.ProjectModel
}


TIMETRACKER.TitleView = Backbone.View.extend {

    el : $ '.title-container'

    events : {
        'click    .swap-project' : 'swapProject'
        'change .select-project' : 'selectProject'
        'click  .select-project' : 'clickSelectProject'
        'click     .add-project' : 'addProject'
        'click  .remove-project' : 'removeProject'
    }

    initialize : ->
        _.bindAll @, 'render', 'swapProject', 'selectProject',
            'clickSelectProject', 'addProject', 'removeProject',
            'toggleProjectSelectList', 'closeSelectProject'
        $(window).on 'click', @closeSelectProject
        @collection = TIMETRACKER.Data

    render : ->
        current = TIMETRACKER.Data.findWhere {current:true}
        @$el.find('.project-name').text " — #{current.get('name')}"
        @

    swapProject : (e) ->
        e.preventDefault()
        e.stopPropagation()
        #if startDate
        #    return alert 'Нельзя переключить пока работает таймер'
        @toggleProjectSelectList()
        null

    selectProject : (e) ->
        #if startDate
        #    return alert 'Нельзя переключить пока работает таймер'
        console.log 'selectProject'
        null

    clickSelectProject : (e) ->
        e.stopPropagation()
        null

    addProject : (e) ->
        e.preventDefault()
        #if startDate
        #    return alert 'Нельзя добавить проект пока работает таймер'
        title = prompt 'Введите название нового проекта:'
        title = $.trim(title or '')
        if not title
            return alert 'Вы не ввели название проекта'
        if @collection.pluck('name').indexOf(title) != -1
            return alert 'Такой проект уже существует'
        TIMETRACKER.Data.add {
            name : title
            current : false
            times : []
        }
        null

    removeProject : (e) ->
        e.preventDefault()
        #if startDate
        #    return alert 'Нельзя удалить проект пока работает таймер'
        console.log 'removeProject'
        null

    closeSelectProject : (e) ->
        e.stopPropagation()
        if $('.select-project').is(':visible') and not $(e.target).hasClass('select-project')
            @toggleProjectSelectList()
        null

    toggleProjectSelectList : ->
        $('.swap-project').toggle()
        $('.select-project').toggle()
        null

}


TIMETRACKER.TimerView = Backbone.View.extend {

    el : $ '.timer-container'

    events : {
        'click  .timer-container a.label' : 'toggleTimer'
        'click  .timer-container a.btn'   : 'toggleTimer'
    }

    initialize : ->
        _.bindAll @, 'render', 'toggleTimer'

    render : ->
        #
        @

    toggleTimer : (e) ->
        e.preventDefault()
        console.log 'toggleTimer'
        null

}


TIMETRACKER.AppView = Backbone.View.extend {

    el : $('#content-wrapper')

    initialize : ->
        _.bindAll @, 'render'
        TIMETRACKER.Data = new TIMETRACKER.ProjectsCollection()
        TIMETRACKER.Data.fetch()
        @render()

    render : ->
        new TIMETRACKER.TitleView().render()
        new TIMETRACKER.TimerView().render()
        new TIMETRACKER.TimesView().render()
        @

}


window.onload = ->
    new TIMETRACKER.AppView()
