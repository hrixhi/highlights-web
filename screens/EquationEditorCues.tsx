import AsyncStorage from '@react-native-async-storage/async-storage';
import { StackScreenProps } from '@react-navigation/stack';
import React, { useEffect, useState, useRef } from 'react';
import { Platform, Alert } from 'react-native';
import { View, TouchableOpacity, Text } from '../components/Themed';
// import alert from '../components/Alert';
// import { fetchAPI } from '../graphql/FetchAPI';
// import { ActivityIndicator, StyleSheet } from 'react-native';
import EquationEditor from 'equation-editor-react';

// import {ReactComponent as ReactLogo} from '../assets/formulaIcons/subscript.svg';

export default function EquationEditorCues({ navigation, route }: StackScreenProps<any, 'pdfviewer'>) {
    const [addElementFromButton, setAddElementFromButton] = useState('');
    const [equation, setEquation] = useState('');

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
            'ƒ',
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
            '‹',
            '›',
            '«',
            '»',
            '‘',
            '’',
            '“',
            '”',
            '–',
            '—',
            '¤',
            '¦',
            '¨',
            '¡',
            '¿',
            'ˆ',
            '˜',
            '−',
            '±',
            '÷',
            '⁄',
            '×',
            '¼',
            '½',
            '¾'
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
            'M',
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
            'ω'
        ],
        Arrows: [
            '←',
            '↑',
            '→',
            '↓',
            '↔',
            '↵',
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
            '◊'
        ],
        Trigonometry: ['sin', 'cos', 'tan', 'sec', 'cosec', 'arccos', 'arcsin', 'arctan', 'θ', 'φ']
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
        'ˆ': 'ˆ',
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
        arctan: 'arctan'
    };

    // MAIN RETURN
    return (<View
                style={{ flexDirection: 'column', padding: 25, backgroundColor: '#f8f8f8' }}
                className="mbsc-align-center mbsc-padding"
            >
                <View
                    style={{
                        width: '100%',
                        backgroundColor: '#f8f8f8'
                    }}
                >
                    {/* Formula Input */}
                    <Text style={{ padding: 10, width: '50%', backgroundColor: '#f8f8f8', fontFamily: 'Inter', fontSize: 18 }}>Enter formula</Text>
                    <View
                        style={{
                            width: '100%',
                            marginBottom: 20,
                            backgroundColor: '#f8f8f8'
                        }}
                    >
                        <View
                            style={{
                                borderColor: '#f2f2f2',
                                borderWidth: 1,
                                borderRadius: 15,
                                padding: 10,
                                minWidth: 200
                            }}
                        >
                            <EquationEditor
                                value={equation}
                                onChange={(eq: string) => setEquation(eq)}
                                autoCommands="bar overline sqrt sum prod int alpha beta gamma delta epsilon zeta eta theta iota kappa lambda mu nu xi omicron pi rho sigma tau upsilon phi chi psi omega Alpha Beta Gamma Delta Zeta Eta Theta Iota Kappa Lambda Mu Nu Xi Omicron Pi Rho Sigma Tau Upsilon Phi Chi Psi Omega lt lte gt gte"
                                autoOperatorNames="sin cos tan sec cosec arccos arcsin arctan lt lte gt gte"
                                addElementFromButton={addElementFromButton}
                                clearAddElementField={() => setAddElementFromButton('')}
                            />
                        </View>
                    </View>
                    
                    {/* Guide */}
                    {/* <View
                        style={{
                            width: '100%',
                            flexDirection: 'row',
                            backgroundColor: '#f8f8f8',
                            borderBottomWidth: 1,
                            borderBottomColor: '#f2f2f2'
                        }}>
                        <View style={{ padding: 10, width: '50%', backgroundColor: '#f8f8f8' }}>Symbol</View>
                        <View style={{ padding: 10, width: '50%', backgroundColor: '#f8f8f8' }}>Keyboard command</View>
                    </View>
                    {symbols.map((s: any) => {
                        return (
                            <View
                                key={JSON.stringify(s)}
                                style={{ width: '100%', flexDirection: 'row', backgroundColor: '#f8f8f8' }}>
                                <View style={{ padding: 10, width: '50%', backgroundColor: '#f8f8f8' }}>
                                    {s.symbol}
                                </View>
                                <View style={{ padding: 10, width: '50%', backgroundColor: '#f8f8f8' }}>{s.howTo}</View>
                            </View>
                        );
                    })} */}
                    <View>
                        {Object.keys(categoriesMap).map((cat: any) => {
                            return (
                                <View
                                    style={{
                                        display: 'flex',
                                        flexDirection: 'column',
                                        backgroundColor: '#f8f8f8',
                                        paddingBottom: 20
                                    }}
                                >
                                    <Text
                                        style={{
                                            fontSize: 14,
                                            fontFamily: 'Inter',
                                            color: '#1f1f1f',
                                            backgroundColor: '#f8f8f8',
                                            marginBottom: 10
                                        }}
                                    >
                                        {cat}
                                    </Text>

                                    <View
                                        style={{
                                            width: '100%',
                                            flexDirection: 'row',
                                            flexWrap: 'wrap',
                                            backgroundColor: '#f8f8f8'
                                        }}
                                    >
                                        {categoriesMap[cat].map((sym: string) => {
                                            return (
                                                <TouchableOpacity
                                                    onPress={() => {
                                                        setAddElementFromButton(symbolsMap[sym]);
                                                    }}
                                                    style={{
                                                        borderColor: '#000',
                                                        borderWidth: 1,
                                                        marginRight: 10,
                                                        marginBottom: 10
                                                    }}
                                                >
                                                    <Text
                                                        style={{
                                                            paddingHorizontal: 10,
                                                            paddingVertical: 5,
                                                            backgroundColor: 'white'
                                                            // marginRight: 10,
                                                            // fontFamily: 'inter'
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
    );

}