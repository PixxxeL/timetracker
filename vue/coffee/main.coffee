
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
}

Vue.component 'timer-view', {
    template: '#timer-tmpl'
}

Vue.component 'times-view', {
    template: '#times-tmpl'
}

Vue.component 'time-view', {
    template: '#time-tmpl'
}

window.onload = ->
    new Vue {
        el: '#app-container'
        template: '#layout-tmpl'
        data: ->
            try
                #console.log 'Try loading data...',  new Date
                TIMETRACKER.Data = JSON.parse(window.localStorage.getItem(
                    TIMETRACKER.Settings.dataStorageKey
                )) or TIMETRACKER.Data
            catch err
                null
            TIMETRACKER.Data
    }
    null