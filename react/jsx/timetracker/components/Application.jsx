import React from 'react';

import storage from '../../utils/local-storage';
import Title from './Title.jsx';
import Timer from './Timer.jsx';
import Times from './Times.jsx';


class Application extends React.Component {

    constructor(props) {
        super(props);
        this.state = {
            current : 'Default',
            data : {
                'Default' : []
            },
            locked : false
        };
        this.changeProject = this._changeProject.bind(this);
        this.addProject = this._addProject.bind(this);
        this.removeProject = this._removeProject.bind(this);
        this.closeTime = this._closeTime.bind(this);
        this.removeTime = this._removeTime.bind(this);
        this.newTimeItem = this._newTimeItem.bind(this);
        this.lock = this._lock.bind(this);
    }

    componentWillMount() {
        this.setState(storage.get('data'));
    }

    componentWillUpdate(nextProps, nextState) {
        storage.set('data', {
            current : nextState.current,
            data : nextState.data
        });
    }

    render() {
        const times = this.state.data[this.state.current];
        const css = this.state.locked ? 'lock' : '';
        return <div id="content-wrapper" className={css}>
            <Title
                changeProject={this.changeProject}
                addProject={this.addProject}
                removeProject={this.removeProject}
                {...this.state}
            />
            <Timer
                newTimeItem={this.newTimeItem}
                lock={this.lock}
                times={times}
            />
            <Times
                close={this.closeTime}
                remove={this.removeTime}
                times={times}
            />
        </div>;
    }

    _lock(lock) {
        this.setState({
            locked : lock
        });
    }

    _addProject(e) {
        e.preventDefault();
        if (this.state.locked) {
            return window.alert('Нельзя добавить проект пока работает таймер');
        }
        let title = window.prompt('Введите название нового проекта:').trim();
        if (!title) {
            return window.alert('Вы не ввели название проекта');
        }
        if (Object.keys(this.state.data).includes(title)) {
            return window.alert('Такой проект уже существует');
        }
        const data = this.state.data;
        data[title] = [];
        this.setState({
            current : title,
            data : data
        });
    }

    _removeProject(e) {
        e.preventDefault();
        if (this.state.locked) {
            return window.alert('Нельзя удалить проект пока работает таймер');
        }
        if (window.confirm('Вы действительно хотите БЕЗВОЗВРАТНО удалить проект?')) {
            if (this.state.current == 'Default') {
                return window.alert('Нельзя удалить проект `Default`');
            }
            const data = this.state.data;
            delete data[this.state.current];
            this.setState({
                current : 'Default',
                data : data
            });
        }
    }

    _changeProject(e) {
        if (this.state.locked) {
            return window.alert('Нельзя сменить проект пока работает таймер');
        }
        this.setState({
            current : e.target.value
        });
    }

    _closeTime(startTs, closed) {
        if (this.state.locked) {
            return window.alert('Нельзя учесть пока работает таймер');
        }
        const times = this.state.data[this.state.current];
        const time = times.find(time => time.startTs == startTs);
        time.closed = closed;
        this.setState({
            data : this.state.data
        });
    }

    _removeTime(startTs) {
        if (this.state.locked) {
            return window.alert('Нельзя удалить пока работает таймер');
        }
        if (!window.confirm('Действительно хотите удалить\nбез возможности восстановить?')) {
            return;
        }
        const times = this.state.data[this.state.current];
        const idx = times.findIndex(time => time.startTs == startTs);
        times.splice(idx, 1);
        this.setState({
            data : this.state.data
        });
    }

    _newTimeItem(timeItem) {
        const times = this.state.data[this.state.current];
        const idx = times.findIndex(time => time.startTs == timeItem.startTs);
        if (idx < 0) {
           times.unshift(timeItem);
        } else {
           times[idx] = timeItem;
        }
        this.setState({
            data : this.state.data
        });
    }

};

export default Application;
