
"""
TODO:
    1. Переименование проекта
    2. При удалении переключать не на дефолтный а на существующий
    3. При добавление проверять уникальность проекта
    4. Если проект 1 то выпадайку не показывать
    5. При клике вне выпадайки - убирать её
"""


TIMETRACKER = {
    Settings : {
        dataStorageKey : 'timetracker-data'
    }
    Data : {}
}

TIMETRACKER.App = ->

    timerEl = $('.timer-container a.label')
    toggleEl = $('.timer-container a.btn')
    startDate = null
    curDesc = ''

    load = ->
        data = localStorage.getItem TIMETRACKER.Settings.dataStorageKey
        if data
            TIMETRACKER.Data = JSON.parse data
        #console.log 'load :', TIMETRACKER.Data
        null

    save = ->
        #console.log 'save :', TIMETRACKER.Data
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
        if TIMETRACKER.Data.data[TIMETRACKER.Data.current].length
            html = ''
            $.each TIMETRACKER.Data.data[TIMETRACKER.Data.current], ->
                start = new Date(this.startTs).toLocaleString()
                end = new Date(this.endTs).toLocaleString()
                diff = this.endTs - this.startTs
                html += """<tr data-start="#{this.startTs}" data-end="#{this.endTs}">
                    <td>#{start}</td>
                    <td>#{end}</td>
                    <td>#{this.desc}</td>
                    <td>#{formatMilliseconds(diff)}</td>
                    <td><a href="#" class="clear-btn" title="Удалить"><i class="fa fa-remove"></i></a></td>
                </tr>"""
                total += diff
            $('.times').find('.empty').hide().end().find('.results').show().find('tbody').html html
        else
            $('.times').find('.empty').show().end().find('.results').hide()
        $('.timer-container .total-time .value').text formatMilliseconds(total)
        null

    renderProjectSelectList = ->
        $('.select-project').empty()
        $.each TIMETRACKER.Data.data, (title, item) ->
            selected = if title == TIMETRACKER.Data.current then ' selected' else ''
            $('.select-project').append """
            <option value="#{title}"#{selected}>#{title}</option>
            """

    toggleTimer = (e) ->
        e.preventDefault()
        if startDate
            toggleEl.find('i.fa').removeClass('fa-pause').addClass('fa-play')
            endDate = new Date
            TIMETRACKER.Data.data[TIMETRACKER.Data.current].unshift {
                startTs : startDate.getTime()
                endTs : endDate.getTime()
                desc : curDesc
            }
            save()
            startDate = null
            renderResults()
        else
            toggleEl.find('i.fa').removeClass('fa-play').addClass('fa-pause')
            startDate = new Date
            curDesc = prompt 'Можете ввести пояснение:'
            curDesc = $.trim curDesc
            requestAnimationFrame renderFrame
        null

    setProject = ->
        if not TIMETRACKER.Data.current
            TIMETRACKER.Data.current = 'Default'
            TIMETRACKER.Data.data = {
                'Default' : []
            }
        $('.title-container .project-name').text " — #{TIMETRACKER.Data.current}"
        renderResults()
        null

    toggleProjectSelectList = ->
        $('.swap-project').toggle()
        $('.select-project').toggle()
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
            $.each TIMETRACKER.Data.data[TIMETRACKER.Data.current], (idx, item) ->
                if item.startTs == start and item.endTs == end
                    removed = idx
            if removed != -1
                TIMETRACKER.Data.data[TIMETRACKER.Data.current].splice removed, 1
                save()
                renderResults()
        null

    $('.swap-project').on 'click', (e) ->
        e.preventDefault()
        # TODO: if len==1 return
        toggleProjectSelectList()
        null

    $('.select-project').on('change', ->
        TIMETRACKER.Data.current = $(@).val()
        save()
        setProject()
        toggleProjectSelectList()
        null
    )

    $('.add-project').on 'click', (e) ->
        e.preventDefault()
        title = prompt 'Введите название нового проекта:'
        title = $.trim title
        if not title
            return alert('Вы не ввели название проекта')
        # TODO: check what project is not exist
        TIMETRACKER.Data.current = title
        TIMETRACKER.Data.data[title] = []
        save()
        renderProjectSelectList()
        setProject()
        null

    $('.remove-project').on 'click', (e) ->
        e.preventDefault()
        if confirm 'Вы действительно хотите БЕЗВОЗВРАТНО удалить проект?'
            if TIMETRACKER.Data.current == 'Default'
                return alert 'Нельзя удалить проект `Default`'
            delete TIMETRACKER.Data.data[TIMETRACKER.Data.current]
            TIMETRACKER.Data.current = 'Default'
            save()
            renderProjectSelectList()
            setProject()
        null

    # TODO: click outside of select list
    #$(window).on 'click', ->
    #    if $('.select-project').is ':visible'
    #        toggleProjectSelectList()
    #    null

    load()
    renderProjectSelectList()
    setProject()

$ ->
    new TIMETRACKER.App()
    null
