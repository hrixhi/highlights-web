# cues

INSTALL - Steps 1-9
RUN - Steps 10-11

NOTE - Repeat steps 5-9 after every "expo install xxx" that you perform.

1. Make sure you that you have Node.js and Git installed on your computer and that you have an iPhone with an internet connection.
2. Run: npm install --global expo-cli in the terminal.
3. Clone this repository and navigate to the downloaded folder using terminal.
4. Run: expo install
5. Go to node_modules/react-native-pell-rich-editor/src and access RichToolbar.js
6. In there, replace the getDefaultIcon function with this function
function getDefaultIcon() {
    const texts = {};
    // new icon styles of experiment
    texts[actions.insertImage] = require('../img/image@2x.png');
    texts[actions.keyboard] = require('../img/keyboard@2x.png');
    texts[actions.setBold] = require('../img/bold@2x.png');
    texts[actions.setItalic] = require('../img/italic@2x.png');
    texts[actions.insertBulletsList] = require('../img/ul@2x.png');
    texts[actions.insertOrderedList] = require('../img/ol@2x.png');
    texts[actions.insertLink] = require('../img/link@2x.png');
    texts[actions.setStrikethrough] = require('../img/strikethrough@2x.png');
    texts[actions.setUnderline] = require('../img/underline@2x.png');
    texts[actions.insertVideo] = require('../img/video@2x.png');
    texts[actions.removeFormat] = require('../img/remove_format@2x.png');
    texts[actions.undo] = require('../img/undo@2x.png');
    texts[actions.redo] = require('../img/redo@2x.png');
    texts[actions.checkboxList] = require('../img/checkbox@2x.png');
    texts[actions.table] = require('../img/table@2x.png');
    texts[actions.code] = require('../img/code@2x.png');
    texts[actions.outdent] = require('../img/outdent@2x.png');
    texts[actions.indent] = require('../img/indent@2x.png');
    texts[actions.alignLeft] = require('../img/justify_left@2x.png');
    texts[actions.alignCenter] = require('../img/justify_center@2x.png');
    texts[actions.alignRight] = require('../img/justify_right@2x.png');
    texts[actions.alignFull] = require('../img/justify_full@2x.png');
    texts[actions.blockquote] = require('../img/blockquote@2x.png');
    texts[actions.line] = require('../img/line@2x.png');
    texts[actions.fontSize] = require('../img/fontSize@2x.png');
    return texts;
}
7. In the react-native-pell-rich-editor, also access editor.js. Find 'Arial', and before that, add overpass.
8. Access the node_modules/react-big-calendar folder and replace its css file with the calendar css file in extra-files folder. 
9. Access the node_modules/react-datetime folder and replace its css file with the datetime css file in the extra-files folder.
10. Run: expo start
11. Click on run in browser.
