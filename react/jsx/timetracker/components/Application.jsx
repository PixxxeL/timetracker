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
            }
        };
        this.changeProject = this._changeProject.bind(this);
        this.addProject = this._addProject.bind(this);
        this.removeProject = this._removeProject.bind(this);
        this.setNewDate = this._setNewDate.bind(this);
        this.closeTime = this._closeTime.bind(this);
        this.removeTime = this._removeTime.bind(this);
    }

    componentWillMount() {
        this.setState(storage.get('data'));
    }

    componentWillUpdate(nextProps, nextState) {
        let term1 = nextState.current != this.state.current,
            term2 = JSON.stringify(this.state.data) != JSON.stringify(nextState.data);
        if (term1 || term2) {
            storage.set('data', {
                current : nextState.current,
                data : nextState.data
            });
        }
    }

    render() {
        return <div id="content-wrapper">
            <Title
                changeProject={this.changeProject}
                addProject={this.addProject}
                removeProject={this.removeProject}
                {...this.state}
            />
            <Timer
                setNewDate={this.setNewDate}
                {...this.state}
            />
            <Times
                close={this.closeTime}
                remove={this.removeTime}
                {...this.state}
            />
        </div>;
    }

    _addProject(e) {
        e.preventDefault();
        //if (this.state.startDate) {
        //    return window.alert('Нельзя добавить проект пока работает таймер');
        //}
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
        //if (this.state.startDate) {
        //    return window.alert('Нельзя удалить проект пока работает таймер');
        //}
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
        this.setState({
            current : e.target.value
        });
    }

    _setNewDate(timeItem, startTs, insert=false) {
        const times = this.state.data[this.state.current];
        if (insert) {
           times.unshift(timeItem);
        } else {
           times[times.findIndex(time => time.startTs == startTs)] = timeItem;
        }
        this.setState({
            data : this.state.data
        });
    }

    _closeTime(startTs, closed) {
        //'Нельзя учесть пока работает таймер'
        const times = this.state.data[this.state.current];
        const time = times.find(time => time.startTs == startTs);
        time.closed = closed;
        this.setState({
            data : this.state.data
        });
    }

    _removeTime(startTs) {
        //'Нельзя удалить пока работает таймер'
        if (!window.confirm('Действительно хотите удалить\nбез возможности восстановить?')) {
            return;
        }
        const times = this.state.data[this.state.current];
        const idx = times.findIndex(time => time.startTs == startTs);
        delete times[idx];
        this.setState({
            data : this.state.data
        });
    }

};

export default Application;
