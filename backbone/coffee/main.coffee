
TIMETRACKER = {
    Settings : {
        dataStorageKey : 'timetracker-data'
    }
}

Backbone.sync = (method, model, options) -> console.log method, model, options

TIMETRACKER.TimeModel = Backbone.Model.extend {
    defaults : {
        closed : false
    }
}

TIMETRACKER.TimeCollection = Backbone.Collection.extend {
    model : TIMETRACKER.TimeModel
}

TIMETRACKER.TimeView = Backbone.View.extend {
    #
}

TIMETRACKER.ProjectModel = Backbone.Model.extend {
    #
}

TIMETRACKER.ProjectCollection = Backbone.Collection.extend {
    model : TIMETRACKER.ProjectModel
}

TIMETRACKER.ProjectView = Backbone.View.extend {
    #
}

window.onload = ->
    alert 'Not implemented'
