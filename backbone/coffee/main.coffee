
TIMETRACKER = {
    Settings : {
        dataStorageKey : 'timetracker-data'
    }
    DefaultData : {
        current : 'Default'
        data : {
            'Default' : []
        }
    }
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


Backbone.sync = (method, model, options) ->
    #console.log 'SYNC', method, model, options
    switch method
        when 'read'
            data = localStorage.getItem TIMETRACKER.Settings.dataStorageKey
            if data
                data = JSON.parse data
            data = data or TIMETRACKER.DefaultData
            resp = _.map data.data, (times, project) ->
                {
                    name : project
                    current : project == data.current
                    times : new TIMETRACKER.TimesCollection(times)
                }
            #console.log model.at(0).get('times').length
        when 'create'
            console.log 'create'
        when 'update'
            console.log 'update'
        when 'delete'
            console.log 'delete'
    if resp
        options.success resp
    else
        options.error 'Not found'


TIMETRACKER.TimeModel = Backbone.Model.extend {
    defaults : {
        closed : false
    }
    start : ->
        new Date(this.get 'startTs').toLocaleString()
    end : ->
        new Date(this.get 'endTs').toLocaleString()
    diff : ->
        this.get 'endTs' - this.get 'startTs'
    diffMs : ->
        TIMETRACKER.formatMilliseconds this.diff()
}


TIMETRACKER.TimesCollection = Backbone.Collection.extend {
    model : TIMETRACKER.TimeModel
}


TIMETRACKER.TimeView = Backbone.View.extend {
    el : 'tr'
    template : _.template $('#time-row-tmpl').html()
    events : {
        'click .clear-btn' : 'removeTime'
        'click .closer'    : 'closeTime'
    }

    removeTime : (e) ->
        e.preventDefault()
        console.log 'removeTime'
        null

    closeTime : (e) ->
        e.preventDefault()
        console.log 'closeTime'
        null
}


TIMETRACKER.ProjectModel = Backbone.Model.extend {
    #
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
        _.bindAll @, 'render'
        $(window).on 'click', @.closeSelectProject
        @collection = new TIMETRACKER.ProjectsCollection()
        @collection.fetch()
        @collection.bind 'change', @.render

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
        console.log 'closeSelectProject'
        null

    render : ->
        console.log this.collection
        @

}


window.onload = ->
    new TIMETRACKER.AppView()
