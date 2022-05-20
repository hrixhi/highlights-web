// REACT
import React, { useState } from 'react';
import { ScrollView, Touchable, Text, Dimensions } from 'react-native';

// COMPONENTS
import { View, TouchableOpacity } from './Themed';
import { Popup } from '@mobiscroll/react';
import EquationEditor from 'equation-editor-react';

const FormulaGuide: React.FunctionComponent<{ [label: string]: any }> = (props: any) => {
    const [addElementFromButton, setAddElementFromButton] = useState('');
    const [activeTab, setActiveTab] = useState('Frequent');

    const categoriesMap = {
        Frequent: [
            'Superscript',
            'Subscript',
            'Degree °',
            'Bar over letter',
            'Sum Σ',
            'Product ∏',
            'Integral ∫',
            'Fraction',
            '√',
            // '∛'
        ],
        Mathematical: [
            // 'ƒ',
            '∞',
            '∼',
            '≅',
            '≈',
            '≠',
            '≡',
            '∈',
            '∉',
            '∋',
            '∧',
            '∨',
            '¬',
            '∩',
            '∪',
            '∂',
            '∀',
            '∃',
            '∅',
            '∇',
            '∗',
            '∝',
            '∠',
            '<',
            '≤',
            '>',
            '≥',
            // '‹',
            // '›',
            // '«',
            // '»',
            '‘',
            '’',
            '“',
            '”',
            '–',
            '—',
            // '¤',
            // '¦',
            '¨',
            // '¡',
            // '¿',
            'ˆ',
            '˜',
            '−',
            '±',
            '÷',
            '⁄',
            '×',
            '¼',
            '½',
            '¾',
        ],
        Latin: [
            'Α',
            'α',
            'Β',
            'β',
            'Γ',
            'γ',
            'Δ',
            'δ',
            'Ε',
            'ε',
            'Ζ',
            'ζ',
            'Η',
            'η',
            'Θ',
            'θ',
            'Ι',
            'ι',
            'Κ',
            'κ',
            'Λ',
            'λ',
            // 'M',
            'μ',
            'Ν',
            'ν',
            'Ξ',
            'ξ',
            'Ο',
            'o',
            'Π',
            'π',
            'Ρ',
            'ρ',
            'Σ',
            'σ',
            'Τ',
            'τ',
            'Υ',
            'υ',
            'Φ',
            'φ',
            'Χ',
            'χ',
            'Ψ',
            'ψ',
            'Ω',
            'ω',
        ],
        Arrows: [
            '←',
            '↑',
            '→',
            '↓',
            '↔',
            // '↵',
            '⇐',
            '⇑',
            '⇒',
            '⇓',
            '⇔',
            '∴',
            '⊂',
            '⊃',
            '⊄',
            '⊆',
            '⊇',
            '⊕',
            '⊗',
            '⊥',
            '⋅',
            '⌈',
            '⌉',
            '⌊',
            '⌋',
            '〈',
            '〉',
            '◊',
        ],
        Trigonometry: ['sin', 'cos', 'tan', 'sec', 'cosec', 'arccos', 'arcsin', 'arctan', 'θ', 'φ'],
    };

    const symbolsMap = {
        // MATHEMATICAL
        ƒ: 'ƒ',
        '∞': '∞',
        '∼': '∼',
        '≅': '≅',
        '≈': '≈',
        '≠': '≠',
        '≡': '≡',
        '∈': '∈',
        '∉': '∉',
        '∋': '∋',
        '∧': '∧',
        '∨': '∨',
        '¬': '¬',
        '∩': '∩',
        '∪': '∪',
        '∂': '∂',
        '∀': '∀',
        '∃': '∃',
        '∅': '∅',
        '∇': '∇',
        '∗': '∗',
        '∝': '∝',
        '∠': '∠',
        '√': 'sqrt',
        // '∛': '\sqrt[3]',

        // QUOTATIONS

        '<': `<`,
        '≤': `\leq`,
        '>': `>`,
        '≥': `\geq`,
        '‹': '‹',
        '›': '›',
        '«': '«',
        '»': '»',
        '‘': '‘',
        '’': '’',
        '“': '“',
        '”': '”',
        '–': '–',
        '—': '—',
        '¤': '¤',
        '¦': '¦',
        '¨': '¨',
        '¡': '¡',
        '¿': '¿',
        ˆ: 'ˆ',
        '˜': '˜',
        '−': '−',
        '±': '±',
        '÷': '÷',
        '⁄': '⁄',
        '×': '×',
        '¼': '¼',
        '½': '½',
        '¾': '¾',

        // FUNCTIONS
        'Degree °': `\circ`,
        Superscript: '^',
        Subscript: '_',
        'Bar over letter': 'bar',
        'Sum Σ': 'sum',
        'Product ∏': 'prod',
        'Integral ∫': 'int',
        Fraction: '/',

        // ARROWS
        '←': '←',
        '↑': '↑',
        '→': '→',
        '↓': '↓',
        '↔': '↔',
        '↵': '↵',
        '⇐': '⇐',
        '⇑': '⇑',
        '⇒': '⇒',
        '⇓': '⇓',
        '⇔': '⇔',
        '∴': '∴',
        '⊂': '⊂',
        '⊃': '⊃',
        '⊄': '⊄',
        '⊆': '⊆',
        '⊇': '⊇',
        '⊕': '⊕',
        '⊗': '⊗',
        '⊥': '⊥',
        '⋅': '⋅',
        '⌈': '⌈',
        '⌉': '⌉',
        '⌊': '⌊',
        '⌋': '⌋',
        '〈': '〈',
        '〉': '〉',
        '◊': '◊',

        // LATIN
        Α: `A`,
        α: 'alpha',
        Β: 'B',
        β: 'beta',
        Γ: `\Gamma`,
        γ: 'gamma',
        Δ: 'Delta',
        δ: 'delta',
        Ε: `E`,
        ε: 'epsilon',
        Ζ: `Z`,
        ζ: 'zeta',
        Η: `H`,
        η: 'eta',
        Θ: `\Theta`,
        θ: 'theta',
        Ι: `I`,
        ι: 'iota',
        Κ: `K`,
        κ: 'kappa',
        Λ: `\Lambda`,
        λ: 'lambda',
        Μ: `M`,
        μ: 'mu',
        Ν: 'N',
        ν: 'nu',
        Ξ: 'Xi',
        ξ: 'xi',
        Ο: 'O',
        o: 'o',
        Π: 'Pi',
        π: 'pi',
        Ρ: 'P',
        ρ: 'rho',
        Σ: 'Sigma',
        σ: 'sigma',
        Τ: 'T',
        τ: 'tau',
        Υ: 'Upsilon',
        υ: 'upsilon',
        Φ: 'Phi',
        φ: 'phi',
        Χ: 'X',
        χ: 'chi',
        Ψ: 'Psi',
        ψ: 'psi',
        Ω: 'Omega',
        ω: 'omega',
        sin: 'sin',
        cos: 'cos',
        tan: 'tan',
        sec: 'sec',
        cosec: 'cosec',
        arccos: 'arccos',
        arcsin: 'arcsin',
        arctan: 'arctan',
    };

    // MAIN RETURN
    return (
        <Popup
            isOpen={props.show}
            // buttons={['ok']}
            buttons={[
                {
                    text: 'Add',
                    color: 'dark',
                    handler: function (event) {
                        props.onInsertEquation();
                    },
                },
                {
                    text: 'Cancel',
                    color: 'dark',
                    handler: function (event) {
                        props.onClose();
                    },
                },
            ]}
            theme="ios"
            themeVariant="light"
            onClose={() => props.onClose()}
            responsive={{
                small: {
                    display: 'bottom',
                },
                medium: {
                    // Custom breakpoint
                    display: 'center',
                },
            }}
        >
            <View
                style={{
                    flexDirection: 'column',
                    padding: Dimensions.get('window').width < 768 ? 0 : 25,
                    backgroundColor: '#f8f8f8',
                }}
                className="mbsc-align-center mbsc-padding"
            >
                <View
                    style={{
                        width: '100%',
                        backgroundColor: '#f8f8f8',
                    }}
                >
                    {/* Formula Input */}
                    <View style={{ padding: 10, width: '50%', backgroundColor: '#f8f8f8' }}>
                        <Text
                            style={{
                                fontSize: 16,
                                fontFamily: 'Inter',
                            }}
                        >
                            Enter formula
                        </Text>
                    </View>
                    <View
                        style={{
                            width: '100%',
                            marginBottom: Dimensions.get('window').width < 768 ? 0 : 20,
                            backgroundColor: '#f8f8f8',
                        }}
                    >
                        <View
                            style={{
                                borderColor: '#f2f2f2',
                                backgroundColor: '#fff',
                                borderWidth: 1,
                                borderRadius: 15,
                                padding: 10,
                                minWidth: 200,
                            }}
                        >
                            <EquationEditor
                                value={props.equation}
                                onChange={props.onChange}
                                autoCommands="bar overline sqrt sum prod int alpha beta gamma delta epsilon zeta eta theta iota kappa lambda mu nu xi omicron pi rho sigma tau upsilon phi chi psi omega Alpha Beta Gamma Delta Zeta Eta Theta Iota Kappa Lambda Mu Nu Xi Omicron Pi Rho Sigma Tau Upsilon Phi Chi Psi Omega lt lte gt gte"
                                autoOperatorNames="sin cos tan sec cosec arccos arcsin arctan lt lte gt gte"
                                addElementFromButton={addElementFromButton}
                                clearAddElementField={() => setAddElementFromButton('')}
                            />
                        </View>
                    </View>

                    <View
                        style={{
                            flexDirection: 'column',
                            backgroundColor: '#f8f8f8',
                        }}
                    >
                        <View
                            style={{
                                paddingTop: 10,
                                marginBottom: 20,
                                flexDirection: 'row',
                                flexWrap: 'wrap',
                                backgroundColor: '#f8f8f8',
                            }}
                        >
                            {Object.keys(categoriesMap).map((cat: string, ind: number) => {
                                return (
                                    <TouchableOpacity
                                        style={{
                                            borderBottomWidth: cat === activeTab ? 1 : 0,
                                            borderBottomColor: '#1f1f1f',
                                            paddingHorizontal: 10,
                                            paddingVertical: 8,
                                            marginRight: 10,
                                            backgroundColor: '#f8f8f8',
                                        }}
                                        onPress={() => {
                                            setActiveTab(cat);
                                        }}
                                        key={ind.toString()}
                                    >
                                        <Text
                                            style={{
                                                fontSize: 13,
                                                fontFamily: 'Inter',
                                            }}
                                        >
                                            {cat}
                                        </Text>
                                    </TouchableOpacity>
                                );
                            })}
                        </View>

                        {Object.keys(categoriesMap).map((cat: any, ind: number) => {
                            if (cat !== activeTab) return null;

                            return (
                                <View
                                    style={{
                                        display: 'flex',
                                        flexDirection: 'column',
                                        backgroundColor: '#f8f8f8',
                                        paddingBottom: 20,
                                    }}
                                    key={ind.toString()}
                                >
                                    {/* <Text
                                        style={{
                                            fontSize: 15,
                                            fontFamily: 'Inter',
                                            color: '#1f1f1f',
                                            backgroundColor: '#f8f8f8',
                                            marginBottom: 10
                                        }}
                                    >
                                        {cat}
                                    </Text> */}

                                    <View
                                        style={{
                                            width: '100%',
                                            flexDirection: 'row',
                                            flexWrap: 'wrap',
                                            backgroundColor: '#f8f8f8',
                                        }}
                                    >
                                        {categoriesMap[cat].map((sym: string, ind: number) => {
                                            return (
                                                <TouchableOpacity
                                                    onPress={() => {
                                                        setAddElementFromButton(symbolsMap[sym]);
                                                    }}
                                                    style={{
                                                        borderColor: '#CCC',
                                                        borderWidth: 1,
                                                        marginRight: 10,
                                                        marginBottom: 10,
                                                        paddingVertical: Dimensions.get('window').width < 768 ? 7 : 8,
                                                        paddingHorizontal:
                                                            Dimensions.get('window').width < 768 ? 10 : 12,
                                                        borderRadius: 10,
                                                        shadowOffset: {
                                                            width: 1,
                                                            height: 1,
                                                        },
                                                        overflow: 'hidden',
                                                        shadowOpacity: 0.03,
                                                        shadowRadius: 3,
                                                    }}
                                                    key={ind.toString()}
                                                >
                                                    <Text
                                                        style={{
                                                            backgroundColor: 'white',
                                                            fontSize: Dimensions.get('window').width < 768 ? 12 : 13,
                                                        }}
                                                    >
                                                        {sym}
                                                    </Text>
                                                </TouchableOpacity>
                                            );
                                        })}
                                    </View>
                                </View>
                            );
                        })}
                    </View>
                </View>
            </View>
        </Popup>
    );
};

export default FormulaGuide;
