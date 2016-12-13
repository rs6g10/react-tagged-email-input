var React = require('react'),
  ReactDOM = require('react-dom'),
  TaggedEmailInput = require('../dist/TaggedEmailInput.js'),
  mountPoint = document.querySelector('#app');

ReactDOM.render(
  <TaggedEmailInput
    autofocus={true}
    backspaceDeletesWord={true}
    placeholder={'Enter emails'}
    unique={true}
    onBeforeAddTag={function() { return true; }}
    onAddTag={function() { console.log('Tag added', arguments); }}
    onBeforeRemoveTag={function() { return true; }}
    onRemoveTag={function() { console.log('Tag removed', arguments); }}
    tags={[]}
  />,
mountPoint );
