'use-strict';
const React = require('react');

const KEY_CODES = {
    ENTER: 13,
    BACKSPACE: 8
};

const validateEmail = (email) => {
    const re = /^(([^<>()[\]\\.,;:\s@\"]+(\.[^<>()[\]\\.,;:\s@\"]+)*)|(\".+\"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
    return re.test(email);
};

const DefaultTagComponent = React.createClass({
    render: function () {
        const p = this.props;
        const className = 'tag' + (p.classes ? (' ' + p.classes) : '');

        return (
            <div className={className}>
                <div className="tag-text" onClick={p.onEdit}>{p.item}</div>
                <div className="remove" onClick={p.onRemove}>
                    {p.removeTagLabel}
                </div>
            </div>
        );
    }

});

module.exports = React.createClass({
    displayName: 'TaggedEmailInput',

    propTypes: {
        onBeforeAddTag: React.PropTypes.func,
        onAddTag: React.PropTypes.func,
        onBeforeRemoveTag: React.PropTypes.func,
        onRemoveTag: React.PropTypes.func,
        onEnter: React.PropTypes.func,
        unique: React.PropTypes.oneOfType([React.PropTypes.bool, React.PropTypes.func]),
        autofocus: React.PropTypes.bool,
        backspaceDeletesWord: React.PropTypes.bool,
        placeholder: React.PropTypes.string,
        tags: React.PropTypes.arrayOf(React.PropTypes.any),
        removeTagLabel: React.PropTypes.oneOfType([React.PropTypes.string, React.PropTypes.object]),
        delimiters: React.PropTypes.arrayOf(function (props, propName, componentName) {
            if (typeof props[propName] !== 'string' || props[propName].length !== 1) {
                return new Error('TaggedEmailInput prop delimiters must be an array of 1 character strings')
            }
        }),
        tagOnBlur: React.PropTypes.bool,
        tabIndex: React.PropTypes.number,
        clickTagToEdit: React.PropTypes.bool
    },

    getDefaultProps: () => {
        return {
            delimiters: [';', ','],
            unique: true,
            autofocus: false,
            backspaceDeletesWord: true,
            tagOnBlur: false,
            clickTagToEdit: false,
            onBeforeAddTag: function (tag) {
                return true;
            },
            onBeforeRemoveTag: function (index) {
                return true;
            }
        };
    },

    getInitialState: function () {
        return {
            tags: (this.props.tags || []).slice(0),
            currentInput: null
        };
    },

    render: function () {
        const self = this, s = self.state, p = self.props;

        let tagComponents = [],
            classes = "tagged-input-wrapper",
            placeholder = '',
            i = 0;

        if (p.classes) {
            classes += ' ' + p.classes;
        }

        if (s.tags.length === 0) {
            placeholder = p.placeholder;
        }

        const TagComponent = DefaultTagComponent;

        for (; i < s.tags.length; i++) {
            tagComponents.push(
                <TagComponent
                    key={'tag' + i}
                    item={s.tags[i]}
                    itemIndex={i}
                    onRemove={self._handleRemoveTag.bind(this, i)}
                    onEdit={p.clickTagToEdit ? self._handleEditTag.bind(this, i) : null}
                    classes={p.unique && (i === s.duplicateIndex) ? 'duplicate' : ''}
                    removeTagLabel={p.removeTagLabel || "\u274C"}
                />
            );
        }

        const input = (
            <input type="email"
                   className="tagged-input"
                   ref="input"
                   onKeyUp={this._handleKeyUp}
                   onKeyDown={this._handleKeyDown}
                   onChange={this._handleChange}
                   onBlur={this._handleBlur}
                   value={s.currentInput}
                   autoFocus="true"
                   placeholder={placeholder}
                   tabIndex={p.tabIndex}>
            </input>
        );

        return (
            <div className={classes} onClick={self._handleClickOnWrapper}>
                {tagComponents}
                {input}
            </div>
        );
    },

    componentDidMount: function () {
        const self = this, p = self.props;

        if (p.autofocus) {
            self.refs.input;
        }
    },

    componentWillReceiveProps: function(nextProps) {
        this.setState({
            tags: (nextProps.tags || []).slice(0)
        })
    },

    _handleRemoveTag: function (index) {
        const self = this, s = self.state, p = self.props;

        if (p.onBeforeRemoveTag(index)) {
            const removedItems = s.tags.splice(index, 1);

            if (s.duplicateIndex) {
                self.setState({duplicateIndex: null}, function () {
                    p.onRemoveTag && p.onRemoveTag(removedItems[0], s.tags);
                });
            } else {
                p.onRemoveTag && p.onRemoveTag(removedItems[0], s.tags);
                self.forceUpdate();
            }
        }
    },

    _handleEditTag: function (index){
        const self = this, s = self.state, p = self.props;
        let removedItems = [];

        if (s.currentInput) {
            const trimmedInput = s.currentInput.trim();
            if (trimmedInput && (this.state.tags.indexOf(trimmedInput) < 0 || !p.unique)) {
                this._validateAndTag(s.currentInput);
            }
        }

        removedItems = s.tags.splice(index, 1);
        if (s.duplicateIndex) {
            self.setState({duplicateIndex: null, currentInput: removedItems[0]}, function () {
                p.onRemoveTag && p.onRemoveTag(removedItems[0]);
            });
        } else {
            self.setState({currentInput: removedItems[0]}, function () {
                p.onRemoveTag && p.onRemoveTag(removedItems[0]);
            });
        }
    },

    _handleKeyUp: function (e) {
        const self = this, s = self.state, p = self.props;

        switch (e.keyCode) {
            case KEY_CODES.ENTER:
                if (s.currentInput) {
                    self._validateAndTag(s.currentInput, function (status) {
                        if (p.onEnter) {
                            p.onEnter(e, s.tags);
                        }
                    });
                }
                break;
        }
    },

    _handleKeyDown: function (e) {
        const self = this, s = self.state, p = self.props;
        let poppedValue = '', newCurrentInput = '';

        switch (e.keyCode) {
            case KEY_CODES.BACKSPACE:
                if (!e.target.value || e.target.value.length < 0) {
                    if (p.onBeforeRemoveTag(s.tags.length - 1)) {
                        poppedValue = s.tags.pop();

                        newCurrentInput = p.backspaceDeletesWord ? '' : poppedValue;

                        this.setState({
                            currentInput: newCurrentInput,
                            duplicateIndex: null
                        });
                        if (p.onRemoveTag && poppedValue) {
                            p.onRemoveTag(poppedValue);
                        }
                    }
                }
                break;
        }
    },

    _handleChange: function (e) {
        const self = this, p = self.props;

        var value = e.target.value,
            lastChar = value.charAt(value.length - 1),
            tagText = value.substring(0, value.length - 1);

        let valueSplits = value.split(',');
        if (valueSplits.length > 1) {
            for (var i = 0; i < valueSplits.length; i++) {
                const email = valueSplits[i].trim();
                if (validateEmail(email)) {
                    self._validateAndTag(email);
                }
            }
        }
        else {
            if (p.delimiters.indexOf(lastChar) !== -1) {
                if (validateEmail(tagText)) {
                    self._validateAndTag(tagText);
                }
            } else {
                this.setState({
                    currentInput: e.target.value
                });
            }
        }
    },

    _handleBlur: function (e) {
        if (this.props.tagOnBlur) {
            const value = e.target.value;
            value && this._validateAndTag(value);
        }
    },

    _handleClickOnWrapper: (e) => {
        this.refs.input;
    },

    _validateAndTag: function (tagText, callback) {
        var self = this, s = self.state, p = self.props;
        let duplicateIndex = -1;
        let trimmedText = '';

        if (tagText && tagText.length > 0) {
            trimmedText = tagText.trim();
            if (p.unique) {

                // not a boolean, it's a function
                if (typeof p.unique === 'function') {
                    duplicateIndex = p.unique(this.state.tags, trimmedText);
                } else {
                    duplicateIndex = this.state.tags.indexOf(trimmedText);
                }

                if (duplicateIndex === -1) {
                    if (!p.onBeforeAddTag(trimmedText)) {
                        return;
                    }

                    s.tags.push(trimmedText);
                    self.setState({
                        currentInput: '',
                        duplicateIndex: null
                    }, function () {
                        p.onAddTag && p.onAddTag(tagText, s.tags);
                        callback && callback(true);
                    });
                } else {
                    self.setState({duplicateIndex: duplicateIndex}, function () {
                        callback && callback(false);
                    });
                }
            } else {
                if (!p.onBeforeAddTag(trimmedText)) {
                    return;
                }

                s.tags.push(trimmedText);
                self.setState({currentInput: ''}, function () {
                    p.onAddTag && p.onAddTag(tagText);
                    callback && callback(true);
                });
            }
        }
    },

    getTags: () => this.state.tags,


    getEnteredText: () =>  this.state.currentInput,

    getAllValues: function () {
        const s = this.state;

        if (s.currentInput && s.currentInput.length > 0) {
            return this.state.tags.concat(s.currentInput);
        } else {
            return this.state.tags;
        }
    }

});
