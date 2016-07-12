
TIMETRACKER = {
    Settings : {
        dataStorageKey : 'timetracker-data'
    }
    CurrentProject : null
    Data : {}
}

TIMETRACKER.AppViewModel = ->
    #https://bitbucket.org/megatyumen-team/tcavs/src/291721716593ba236e30cda6eb41b1a9dace246a/joomla-extensions/mod_etmform/tmpl/default.php?at=master&fileviewer=file-view-default
    #https://bitbucket.org/megatyumen-team/tcavs/src/291721716593ba236e30cda6eb41b1a9dace246a/joomla-extensions/mod_etmform/js/etmform.js?at=master&fileviewer=file-view-default
    null

TIMETRACKER.App = ->
    #ko.applyBindings(new TIMETRACKER.AppViewModel(), $('#app-container').get(0));
    timerEl = $('.timer-container a.label')
    toggleEl = $('.timer-container a.btn')
    startDate = null
    load = ->
        data = localStorage.getItem TIMETRACKER.Settings.dataStorageKey
        if data
            TIMETRACKER.Data = JSON.parse data
        null
    save = ->
        data = JSON.stringify TIMETRACKER.Data
        localStorage.setItem TIMETRACKER.Settings.dataStorageKey, data
        null
    formatMilliseconds = (ms) ->
        ms = (ms * .001) | 0
        seconds = ms % 60
        minutes = ((ms / 60) % 60) | 0
        hours = (ms / 60 / 60) | 0
        if seconds < 10
            seconds = "0#{seconds}"
        if minutes < 10
            minutes = "0#{minutes}"
        "#{hours}:#{minutes}:#{seconds}"
    renderFrame = ->
        if startDate
            diff = new Date().getTime() - startDate.getTime()
            timerEl.text formatMilliseconds(diff)
            requestAnimationFrame renderFrame
        null
    renderResults = ->
        total = 0
        if not TIMETRACKER.Data[TIMETRACKER.CurrentProject]
            TIMETRACKER.Data[TIMETRACKER.CurrentProject] = []
        if TIMETRACKER.Data[TIMETRACKER.CurrentProject].length
            html = ''
            $.each TIMETRACKER.Data[TIMETRACKER.CurrentProject], ->
                start = new Date(this.startTs).toLocaleString()
                end = new Date(this.endTs).toLocaleString()
                diff = this.endTs - this.startTs
                html += """<tr data-start="#{this.startTs}" data-end="#{this.endTs}">
                    <td>#{start}</td>
                    <td>#{end}</td>
                    <td>#{formatMilliseconds(diff)}</td>
                    <td><a href="#" class="clear-btn" title="Удалить"><i class="fa fa-remove"></i></a></td>
                </tr>"""
                total += diff
            $('.times').find('.empty').hide().end().find('.results').show().find('tbody').html html
        else
            $('.times').find('.empty').show().end().find('.results').hide()
        $('.timer-container .total-time .value').text formatMilliseconds(total)
        null
    renderProjectsSelect = ->
        $.each TIMETRACKER.Data, ->
            console.log arguments
    toggleTimer = (e) ->
        e.preventDefault()
        if startDate
            toggleEl.find('i.fa').removeClass('fa-pause').addClass('fa-play')
            endDate = new Date
            TIMETRACKER.Data[TIMETRACKER.CurrentProject].push {
                startTs : startDate.getTime()
                endTs : endDate.getTime()
            }
            save()
            startDate = null
            renderResults()
        else
            toggleEl.find('i.fa').removeClass('fa-play').addClass('fa-pause')
            startDate = new Date
            requestAnimationFrame renderFrame
        null
    #addProject = ->
    #    title = prompt 'Введите название:'
    #    TIMETRACKER.CurrentProject = title or 'Default'
    #    null
    changeProject = ->
        title = prompt 'Выберите проект'
        TIMETRACKER.CurrentProject = title or 'Default'
        $('.title-container .project-name').text " — #{TIMETRACKER.CurrentProject}"
        renderResults()
        null
    timerEl.on 'click', toggleTimer
    toggleEl.on 'click', toggleTimer
    $('.times .results').on 'click', '.clear-btn', (e) ->
        e.preventDefault()
        tr = $(@).parents('tr')
        start = parseFloat tr.data('start')
        end = parseFloat tr.data('end')
        if confirm 'Действительно хотите удалить\nбез возможности восстановить?'
            removed = -1
            $.each TIMETRACKER.Data[TIMETRACKER.CurrentProject], (idx, item) ->
                if item.startTs == start and item.endTs == end
                    removed = idx
            if removed != -1
                TIMETRACKER.Data[TIMETRACKER.CurrentProject].splice removed, 1
                save()
                renderResults()
        null
    $('.change-project').on 'click', (e) ->
        e.preventDefault()
        changeProject()
        null
    load()
    changeProject()

$ ->
    new TIMETRACKER.App()
    null
