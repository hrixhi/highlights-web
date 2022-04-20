export const FULL_FLEDGED_TOOLBAR_BUTTONS = (width: number) => {
    return {
        moreText: {
            buttons: [
                'bold',
                'italic',
                'underline',
                'strikeThrough',
                'subscript',
                'superscript',
                'fontFamily',
                'fontSize',
                'textColor',
                'backgroundColor',
                'inlineClass',
                'inlineStyle',
                'clearFormatting'
            ],
            buttonsVisible: width < 768 ? 3 : 3
        },
        moreParagraph: {
            buttons: [
                'alignLeft',
                'alignCenter',
                'formatOLSimple',
                'alignRight',
                'alignJustify',
                'formatOL',
                'formatUL',
                'paragraphFormat',
                'paragraphStyle',
                'lineHeight',
                'outdent',
                'indent',
                'quote'
            ],
            buttonsVisible: width < 768 ? 2 : 3
        },
        moreRich: {
            buttons: [
                'insertLink',
                'insertImage',
                'insertFile',
                'insertTable',
                'insertVideo',
                'insertFormula',
                'emoticons',
                'fontAwesome',
                'specialCharacters',
                'embedly',
                'insertHR'
            ],
            buttonsVisible: width < 768 ? 3 : 4
        },
        moreMisc: {
            buttons: ['undo', 'redo', 'fullscreen', 'print', 'getPDF', 'spellChecker', 'selectAll', 'html', 'help'],
            align: 'right',
            buttonsVisible: width < 768 ? 2 : 2
        },
        pluginsEnabled: [
            'align',
            'charCounter',
            'codeBeautifier',
            'codeView',
            'colors',
            'draggable',
            'embedly',
            'emoticons',
            'entities',
            'file',
            'fontAwesome',
            'fontFamily',
            'fontSize',
            'fullscreen',
            'image',
            'imageTUI',
            'imageManager',
            'inlineStyle',
            'inlineClass',
            'lineBreaker',
            'lineHeight',
            'link',
            'lists',
            'paragraphFormat',
            'paragraphStyle',
            'quickInsert',
            'quote',
            'save',
            'table',
            'url',
            'video',
            'wordPaste'
        ]
    }
};

export const QUIZ_INSTRUCTIONS_TOOLBAR_BUTTONS = {
    moreText: {
        buttons: [
            'bold',
            'italic',
            'underline',
            'strikeThrough',
            'subscript',
            'superscript',
            'fontFamily',
            'fontSize',
            'textColor',
            'backgroundColor',
            'clearFormatting'
        ],
        buttonsVisible: 2
    },
    moreParagraph: {
        buttons: ['formatOL', 'formatUL']
    },
    moreRich: {
        buttons: [
            'insertLink',
            'insertImage',
            'insertTable',
            'insertFormula',
            'emoticons',
            'fontAwesome',
            'specialCharacters'
        ],
        buttonsVisible: 2
    },
    moreMisc: {
        buttons: ['undo', 'redo'],
        align: 'right',
        buttonsVisible: 2
    },
    pluginsEnabled: [
        'align',
        'charCounter',
        'codeBeautifier',
        'codeView',
        'colors',
        'draggable',
        'embedly',
        'emoticons',
        'entities',
        'file',
        'fontAwesome',
        'fontFamily',
        'fontSize',
        'fullscreen',
        'image',
        'imageTUI',
        'imageManager',
        'inlineStyle',
        'inlineClass',
        'lineBreaker',
        'lineHeight',
        'link',
        'lists',
        'paragraphFormat',
        'paragraphStyle',
        'quickInsert',
        'quote',
        'save',
        'table',
        'url',
        'video',
        'wordPaste'
    ]
};

export const QUIZ_QUESTION_TOOLBAR_BUTTONS = {
    moreText: {
        buttons: [
            'bold',
            'italic',
            'underline',
            'strikeThrough',
            'subscript',
            'superscript',
            'fontFamily',
            'fontSize',
            'textColor',
            'backgroundColor',
            'clearFormatting'
        ],
        buttonsVisible: 3
    },
    moreParagraph: {
        buttons: ['formatOLSimple', 'formatUL']
    },
    moreRich: {
        buttons: [
            'insertImage',
            'insertVideo',
            'insertTable',
            'insertFormulaQuestion',
            'insertLink',
            'emoticons',
            'fontAwesome',
            'specialCharacters'
        ],
        buttonsVisible: 4
    },
    moreMisc: {
        buttons: ['undo', 'redo'],
        align: 'right',
        buttonsVisible: 2
    },
    pluginsEnabled: [
        'align',
        'charCounter',
        'codeBeautifier',
        'codeView',
        'colors',
        'draggable',
        'embedly',
        'emoticons',
        'entities',
        'file',
        'fontAwesome',
        'fontFamily',
        'fontSize',
        'fullscreen',
        'image',
        'imageTUI',
        'imageManager',
        'inlineStyle',
        'inlineClass',
        'lineBreaker',
        'lineHeight',
        'link',
        'lists',
        'paragraphFormat',
        'paragraphStyle',
        'quickInsert',
        'quote',
        'save',
        'table',
        'url',
        'video',
        'wordPaste'
    ]
};

export const QUIZ_SOLUTION_TOOLBAR_BUTTONS = {
    moreText: {
        buttons: [
            'bold',
            'italic',
            'underline',
            'strikeThrough',
            'subscript',
            'superscript',
            'fontFamily',
            'fontSize',
            'textColor',
            'backgroundColor',
            'clearFormatting'
        ],
        buttonsVisible: 3
    },
    moreParagraph: {
        buttons: ['formatOLSimple', 'formatUL']
    },
    moreRich: {
        buttons: [
            'insertImage',
            // 'insertVideo',
            'insertTable',
            'insertFormulaSolution',
            'insertLink',
            'emoticons',
            'fontAwesome',
            'specialCharacters'
        ],
        buttonsVisible: 4
    },
    moreMisc: {
        buttons: ['undo', 'redo'],
        align: 'right',
        buttonsVisible: 2
    },
    pluginsEnabled: [
        'align',
        'charCounter',
        'codeBeautifier',
        'codeView',
        'colors',
        'draggable',
        'embedly',
        'emoticons',
        'entities',
        'file',
        'fontAwesome',
        'fontFamily',
        'fontSize',
        'fullscreen',
        'image',
        'imageTUI',
        'imageManager',
        'inlineStyle',
        'inlineClass',
        'lineBreaker',
        'lineHeight',
        'link',
        'lists',
        'paragraphFormat',
        'paragraphStyle',
        'quickInsert',
        'quote',
        'save',
        'table',
        'url',
        // 'video',
        'wordPaste'
    ]
};

export const QUIZ_OPTION_TOOLBAR_BUTTONS = {
    moreText: {
        buttons: [
            'bold',
            'italic',
            'underline',
            'strikeThrough',
            'subscript',
            'superscript',
            'fontFamily',
            'fontSize',
            'textColor',
            'backgroundColor',
            'clearFormatting'
        ],
        buttonsVisible: 2
    },
    moreParagraph: {
        buttons: ['formatOLSimple', 'formatUL'],
        buttonsVisible: 0
    },
    moreRich: {
        buttons: [
            'insertImage',
            'insertFormulaOption',
            'insertTable',
            'insertLink',
            'emoticons',
            'fontAwesome',
            'specialCharacters'
        ],
        buttonsVisible: 2
    },
    moreMisc: {
        buttons: ['undo', 'redo'],
        align: 'right',
        buttonsVisible: 2
    },
    pluginsEnabled: [
        'align',
        'charCounter',
        'codeBeautifier',
        'codeView',
        'colors',
        'draggable',
        'embedly',
        'emoticons',
        'entities',
        'file',
        'fontAwesome',
        'fontFamily',
        'fontSize',
        'fullscreen',
        'image',
        'imageTUI',
        'imageManager',
        'inlineStyle',
        'inlineClass',
        'lineBreaker',
        'lineHeight',
        'link',
        'lists',
        'paragraphFormat',
        'paragraphStyle',
        'quickInsert',
        'quote',
        'save',
        'table',
        'url',
        'video',
        'wordPaste'
    ]
};

export const HIGHLIGHT_BUTTONS = {
    moreText: {
        buttons: [
            'backgroundColor',
            'bold',
            'italic',
            'underline',
            'strikeThrough',
            'subscript',
            'superscript',
            'clearFormatting'
        ],
        buttonsVisible: 3
    },
    moreParagraph: {
        buttons: ['formatOLSimple', 'formatUL'],
        buttonsVisible: 2
    },
    moreRich: {
        buttons: [
            'insertImage',
            'insertFormulaOption',
            'insertTable',
            'insertLink',
            'emoticons',
            'fontAwesome',
            'specialCharacters'
        ],
        buttonsVisible: 2
    },
    moreMisc: {
        buttons: ['undo', 'redo'],
        align: 'right',
        buttonsVisible: 2
    },
    pluginsEnabled: [
        'colors',
    ]
};


export const INLINE_CHOICE_BUTTONS = {
    moreText: {
        buttons: [
            'insertChoice',
            'bold',
            'italic',
            'underline',
            'strikeThrough',
            'subscript',
            'superscript',
            'clearFormatting'
        ],
        buttonsVisible: 3
    },
    moreParagraph: {
        buttons: ['formatOLSimple', 'formatUL'],
        buttonsVisible: 2
    },
    moreRich: {
        buttons: [
            'insertImage',
            'insertFormulaOption',
            'insertTable',
            'insertLink',
            'emoticons',
            'fontAwesome',
            'specialCharacters'
        ],
        buttonsVisible: 2
    },
    moreMisc: {
        buttons: ['undo', 'redo'],
        align: 'right',
        buttonsVisible: 2
    },
    pluginsEnabled: [
        'colors',
    ]
};

export const TEXT_ENTRY_BUTTONS = {
    moreText: {
        buttons: [
            'insertTextEntryField',
            'bold',
            'italic',
            'underline',
            'strikeThrough',
            'subscript',
            'superscript',
            'clearFormatting'
        ],
        buttonsVisible: 3
    },
    moreParagraph: {
        buttons: ['formatOLSimple', 'formatUL'],
        buttonsVisible: 2
    },
    moreRich: {
        buttons: [
            'insertImage',
            'insertFormulaOption',
            'insertTable',
            'insertLink',
            'emoticons',
            'fontAwesome',
            'specialCharacters'
        ],
        buttonsVisible: 2
    },
    moreMisc: {
        buttons: ['undo', 'redo'],
        align: 'right',
        buttonsVisible: 2
    },
    pluginsEnabled: [
        'align',
        'charCounter',
        'codeBeautifier',
        'codeView',
        'colors',
        'draggable',
        'embedly',
        'emoticons',
        'entities',
        'file',
        'fontAwesome',
        'fontFamily',
        'fontSize',
        'fullscreen',
        'image',
        'imageTUI',
        'imageManager',
        'inlineStyle',
        'inlineClass',
        'lineBreaker',
        'lineHeight',
        'link',
        'lists',
        'paragraphFormat',
        'paragraphStyle',
        'quickInsert',
        'quote',
        'save',
        'table',
        'url',
        'video',
        'wordPaste'
    ]
};

export const DISCUSS_POST_TOOLBAR_BUTTONS = {
    moreText: {
        buttons: [
            'bold',
            'italic',
            'underline',
            'strikeThrough',
            'subscript',
            'superscript',
            'fontFamily',
            'fontSize',
            'textColor',
            'backgroundColor',
            'clearFormatting'
        ],
        buttonsVisible: 3
    },
    moreParagraph: {
        buttons: ['formatOLSimple', 'formatUL']
    },
    moreRich: {
        buttons: [
            'insertImage',
            'insertFile',
            'insertVideo',
            'insertTable',
            'insertFormula',
            'insertLink',
            'emoticons',
            'fontAwesome',
            'specialCharacters'
        ],
        buttonsVisible: 3
    },
    moreMisc: {
        buttons: ['undo', 'redo'],
        align: 'right',
        buttonsVisible: 2
    },
    pluginsEnabled: [
        'align',
        'charCounter',
        'codeBeautifier',
        'codeView',
        'colors',
        'draggable',
        'embedly',
        'emoticons',
        'entities',
        'file',
        'fontAwesome',
        'fontFamily',
        'fontSize',
        'fullscreen',
        'image',
        'imageTUI',
        'imageManager',
        'inlineStyle',
        'inlineClass',
        'lineBreaker',
        'lineHeight',
        'link',
        'lists',
        'paragraphFormat',
        'paragraphStyle',
        'quickInsert',
        'quote',
        'save',
        'table',
        'url',
        'video',
        'wordPaste'
    ]
};


export const DISCUSS_REPLY_TOOLBAR_BUTTONS = {
    moreText: {
        buttons: [
            'bold',
            'italic',
            'underline',
            'strikeThrough',
            'subscript',
            'superscript',
            'fontFamily',
            'fontSize',
            'textColor',
            'backgroundColor',
            'clearFormatting'
        ],
        buttonsVisible: 2
    },
    moreParagraph: {
        buttons: ['formatOLSimple', 'formatUL']
    },
    moreRich: {
        buttons: [
            'insertImage',
            'insertFile',
            'insertVideo',
            'insertTable',
            'insertFormula',
            'insertLink',
            'emoticons',
            'fontAwesome',
            'specialCharacters'
        ],
        buttonsVisible: 2
    },
    moreMisc: {
        buttons: ['undo', 'redo'],
        align: 'right',
        buttonsVisible: 2
    },
    pluginsEnabled: [
        'align',
        'charCounter',
        'codeBeautifier',
        'codeView',
        'colors',
        'draggable',
        'embedly',
        'emoticons',
        'entities',
        'file',
        'fontAwesome',
        'fontFamily',
        'fontSize',
        'fullscreen',
        'image',
        'imageTUI',
        'imageManager',
        'inlineStyle',
        'inlineClass',
        'lineBreaker',
        'lineHeight',
        'link',
        'lists',
        'paragraphFormat',
        'paragraphStyle',
        'quickInsert',
        'quote',
        'save',
        'table',
        'url',
        'video',
        'wordPaste'
    ]
};