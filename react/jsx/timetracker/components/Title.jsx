import React from 'react';


class Title extends React.Component {

    constructor(props) {
        super(props);
        this.state = {
            isSelect : false
        };
        this.selectProject = this._selectProject.bind(this);
        this.setSelectProjectRef = this._setSelectProjectRef.bind(this);
        this.clickOutsideSelectProject = this._clickOutsideSelectProject.bind(this);
        this.changeProject = this._changeProject.bind(this);
    }

    componentDidMount() {
        document.addEventListener('mouseup', this.clickOutsideSelectProject);
    }

    componentWillUnmount() {
        document.removeEventListener('mouseup', this.clickOutsideSelectProject);
    }

    render() {
        const titles = Object.keys(this.props.data || {});
        return <div className="title-container">
            <div className="buttons">
                {
                    this.state.isSelect ?
                    <select
                        className="select-project"
                        value={this.props.current}
                        onChange={this.changeProject}
                        ref={this.setSelectProjectRef}
                    >{
                        titles.map((title, idx) => <option key={idx} value={title}>{title}</option>)
                    }</select> :
                    null
                }
                {
                    titles.length > 1 && !this.state.isSelect ?
                    <a
                        href="#"
                        title="Сменить проект"
                        className="swap-project"
                        onClick={this.selectProject}
                    >
                        <i className="fa fa-list"></i>
                    </a> :
                    null
                }
                <a
                    href="#"
                    title="Добавить проект"
                    className="add-project"
                    onClick={this.props.addProject}
                >
                    <i className="fa fa-plus"></i>
                </a>
                <a
                    href="#"
                    title="Удалить проект"
                    className="remove-project"
                    onClick={this.props.removeProject}
                >
                    <i className="fa fa-minus"></i>
                </a>
            </div>
            <h1>
                Time Tracker
                <span className="project-name"> — {this.props.current}</span>
            </h1>
        </div>
    }

    _selectProject(e) {
        e.preventDefault();
        if (this.props.startDate) {
            return window.alert('Нельзя переключить пока работает таймер');
        }
        this.setState({
            isSelect : !this.state.isSelect
        });
    }

    _setSelectProjectRef(node) {
        this.SelectProjectRef = node;
    }

    _clickOutsideSelectProject(e) {
        if (this.SelectProjectRef && !this.SelectProjectRef.contains(e.target)) {
            this.setState({
                isSelect : false
            });
        }
    }

    _changeProject(e) {
        this.props.changeProject(e);
        this.setState({
            isSelect : false
        });
    }

}

export default Title;
