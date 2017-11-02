
"""
TODO:
    1. Переименование проекта
    2. При удалении переключать не на дефолтный а на существующий
    3. Минификация и склейка js и css
    4. Адаптивность
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
    titles = []
    loopCounter = 0

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
        loopCounter += 1
        if startDate
            diff = new Date().getTime() - startDate.getTime()
            timerEl.text formatMilliseconds(diff)
            if loopCounter % 100 is 0 # per 5 seconds
                saveTimer()
            requestAnimationFrame renderFrame
        null

    renderResults = ->
        total = 0
        opened = 0
        if TIMETRACKER.Data.data[TIMETRACKER.Data.current].length
            html = ''
            $.each TIMETRACKER.Data.data[TIMETRACKER.Data.current], ->
                start = new Date(this.startTs).toLocaleString()
                end = new Date(this.endTs).toLocaleString()
                diff = this.endTs - this.startTs
                if this.closed
                    checked = 'checked'
                    closed = 'class="closed"'
                    hidden = 'class="m-hidden closed"'
                else
                    checked = ''
                    closed = ''
                    hidden = 'class="m-hidden"'
                    opened += diff
                html += """<tr data-start="#{this.startTs}" data-end="#{this.endTs}">
                    <td><input type="checkbox" class="closer" #{checked}></td>
                    <td #{closed}>#{start}</td>
                    <td #{closed}>#{end}</td>
                    <td #{hidden}>#{this.desc}</td>
                    <td #{closed}>#{formatMilliseconds(diff)}</td>
                    <td><a href="#" class="clear-btn" title="Удалить"><i class="fa fa-remove"></i></a></td>
                </tr>"""
                total += diff
            $('.times').find('.empty').hide().end().find('.results').show().find('tbody').html html
        else
            $('.times').find('.empty').show().end().find('.results').hide()
        total_container = $('.timer-container .total-time')
        total_container.find('.value.total').text formatMilliseconds(total)
        total_container.find('.value.opened').text formatMilliseconds(opened)
        null

    renderProjectSelectList = ->
        $('.select-project').empty()
        $.each TIMETRACKER.Data.data, (title, item) ->
            selected = if title == TIMETRACKER.Data.current then ' selected' else ''
            $('.select-project').append """
            <option value="#{title}"#{selected}>#{title}</option>
            """
            titles.push title
        if titles.length < 2
            $('.swap-project').hide()
        else
            $('.swap-project').show()

    saveTimer = (insert=false) ->
        times = TIMETRACKER.Data.data[TIMETRACKER.Data.current]
        startTs = startDate.getTime()
        timeItem = {
            startTs : startTs
            endTs : new Date().getTime()
            desc : curDesc
            closed : false
        }
        if insert
            times.unshift timeItem
        else
            $.each times, (idx, item) ->
                if item.startTs == startTs
                    times[idx] = timeItem
                null
        save()
        renderResults()

    toggleTimer = (e) ->
        e.preventDefault()
        $('#content-wrapper').toggleClass 'lock'
        if startDate
            toggleEl.find('i.fa').removeClass('fa-pause').addClass('fa-play')
            saveTimer()
            startDate = null
        else
            toggleEl.find('i.fa').removeClass('fa-play').addClass('fa-pause')
            loopCounter = 0
            startDate = new Date
            curDesc = prompt 'Можете ввести пояснение:'
            curDesc = $.trim curDesc
            saveTimer true
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

    ## Bindings

    timerEl.on 'click', toggleTimer

    toggleEl.on 'click', toggleTimer

    $('.times .results').on 'click', '.clear-btn', (e) ->
        e.preventDefault()
        if startDate
            return alert 'Нельзя удалить пока работает таймер'
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

    $('.times .results').on 'change', '.closer', (e) ->
        e.preventDefault()
        if startDate
            return alert 'Нельзя учесть пока работает таймер'
        tr = $(@).parents('tr')
        start = parseFloat tr.data('start')
        end = parseFloat tr.data('end')
        closed = -1
        $.each TIMETRACKER.Data.data[TIMETRACKER.Data.current], (idx, item) ->
            if item.startTs == start and item.endTs == end
                closed = idx
        if closed != -1
            item = TIMETRACKER.Data.data[TIMETRACKER.Data.current][closed]
            item.closed = not item.closed
            save()
            renderResults()
        null

    $('.swap-project').on 'click', (e) ->
        e.preventDefault()
        e.stopPropagation()
        if startDate
            return alert 'Нельзя переключить пока работает таймер'
        toggleProjectSelectList()
        null

    $('.select-project').on('change', ->
        TIMETRACKER.Data.current = $(@).val()
        save()
        setProject()
        toggleProjectSelectList()
        null
    ).on 'click', (e) ->
        e.stopPropagation()
        null

    $('.add-project').on 'click', (e) ->
        e.preventDefault()
        if startDate
            return alert 'Нельзя добавить проект пока работает таймер'
        title = prompt 'Введите название нового проекта:'
        title = $.trim title
        if not title
            return alert 'Вы не ввели название проекта'
        if $.inArray(title, titles) != -1
            return alert 'Такой проект уже существует'
        TIMETRACKER.Data.current = title
        TIMETRACKER.Data.data[title] = []
        save()
        renderProjectSelectList()
        setProject()
        null

    $('.remove-project').on 'click', (e) ->
        e.preventDefault()
        if startDate
            return alert 'Нельзя удалить проект пока работает таймер'
        if confirm 'Вы действительно хотите БЕЗВОЗВРАТНО удалить проект?'
            if TIMETRACKER.Data.current == 'Default'
                return alert 'Нельзя удалить проект `Default`'
            delete TIMETRACKER.Data.data[TIMETRACKER.Data.current]
            TIMETRACKER.Data.current = 'Default'
            save()
            renderProjectSelectList()
            setProject()
        null

    $(window).on 'click', (e) ->
        if $('.select-project').is(':visible') and not $(e.target).hasClass('select-project')
            toggleProjectSelectList()
        null

    ## Entry point

    load()
    renderProjectSelectList()
    setProject()

$ ->
    new TIMETRACKER.App()
    null
