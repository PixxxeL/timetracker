
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
    switch method
        when 'read'
            data = localStorage.getItem TIMETRACKER.Settings.dataStorageKey
            if data
                data = JSON.parse data
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


TIMETRACKER.ProjectModel = Backbone.Model.extend {
    defaults : {
        current : false
        times : []
    }
}


TIMETRACKER.ProjectsCollection = Backbone.Collection.extend {
    model : TIMETRACKER.ProjectModel
}


TIMETRACKER.AppView = Backbone.View.extend {

    el : $('#content-wrapper')

    events : {
        'click    .swap-project'          : 'swapProject'
        'change .select-project'          : 'selectProject'
        'click  .select-project'          : 'clickSelectProject'
        'click     .add-project'          : 'addProject'
        'click  .remove-project'          : 'removeProject'
        'click  .timer-container a.label' : 'toggleTimer'
        'click  .timer-container a.btn'   : 'toggleTimer'
    }

    initialize : ->
        _.bindAll @, 'render', 'addTime'
        $(window).on 'click', @.closeSelectProject
        TIMETRACKER.Data = new TIMETRACKER.ProjectsCollection()
        #TIMETRACKER.Data.bind 'change', -> console.log 'change'
        #TIMETRACKER.Data.bind 'add', @render
        TIMETRACKER.Data.fetch()
        @render()

    swapProject : (e) ->
        e.preventDefault()
        e.stopPropagation()
        console.log 'swapProject'
        null

    selectProject : (e) ->
        console.log 'selectProject'
        null

    addProject : (e) ->
        e.preventDefault()
        console.log 'addProject'
        null

    removeProject : (e) ->
        e.preventDefault()
        console.log 'removeProject'
        null

    toggleTimer : (e) ->
        e.preventDefault()
        console.log 'toggleTimer'
        null

    clickSelectProject : (e) ->
        e.stopPropagation()
        console.log 'clickSelectProject'
        null

    closeSelectProject : (e) ->
        e.stopPropagation()
        if $('.select-project').is(':visible') and not $(e.target).hasClass('select-project')
            @toggleProjectSelectList()
        null

    render : ->
        project = TIMETRACKER.Data.findWhere({current:true})
        times = project.get 'times'
        if times.length
            times.each @addTime
            @$el.find('.results').show()
            @$el.find('.empty').hide()
        else
            @$el.find('.results').hide()
            @$el.find('.empty').show()
        @

    addTime : (time) ->
        view = new TIMETRACKER.TimeView {model: time}
        @$el.find('.results tbody').append view.render().$el

    toggleProjectSelectList : ->
        $('.swap-project').toggle()
        $('.select-project').toggle()
        null

}


window.onload = ->
    new TIMETRACKER.AppView()
