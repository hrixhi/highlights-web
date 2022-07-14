import { StackScreenProps } from '@react-navigation/stack';
import React, { useEffect, useState, useRef } from 'react';
import { Platform, Alert, Dimensions, ActivityIndicator } from 'react-native';
import { View, TouchableOpacity, Text } from '../components/Themed';
// import alert from '../components/Alert';
// import { ActivityIndicator, StyleSheet } from 'react-native';
import EquationEditor from 'equation-editor-react';
import { Ionicons } from '@expo/vector-icons';

import { renderMathjax } from '../helpers/FormulaHelpers';

import BottomSheetButton from '../components/BottomSheetButton';

export default function EquationEditorCues({ navigation, route }: StackScreenProps<any, 'equationEditor'>) {
    const [addElementFromButton, setAddElementFromButton] = useState('');

    const [typeFromButton, setTypeFromButton] = useState('');

    const [keystrokeFromButton, setKeystrokeFromButton] = useState('');

    const [equation, setEquation] = useState('');
    const [activeTab, setActiveTab] = useState('Keyboard');
    const [loading, setLoading] = useState(true);

    const [isNumericKeyboard, setIsNumericKeyboard] = useState(false);
    const [uppercase, setUppercase] = useState(false);
    const [showInsertButton, setShowInsertButton] = useState(false);

    useEffect(() => {
        const equationParam = route?.params?.equation;
        const showInsertButton = route?.params?.showInsertButton;

        console.log('Equation param', equationParam);
        if (equationParam) {
            setEquation(decodeURIComponent(equationParam));
        }

        if (showInsertButton) {
            setShowInsertButton(true);
        }

        setLoading(false);
    }, []);

    useEffect(() => {
        var url = window.location.href;
        var urlSplit = url.split('?');

        var obj = {
            title: 'New title',
            url:
                urlSplit[0] +
                '?equation=' +
                encodeURIComponent(equation) +
                (showInsertButton ? '&showInsertButton=true' : ''),
        };
        window.history.pushState(obj, obj.title, obj.url);
    }, [equation]);

    const categoriesMap = {
        Keyboard: [],
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
            '+',
            '-',
            '÷',
            '×',
            '=',
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
        '+': '+',
        '=': '=',
        '-': '-',
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

    if (loading) {
        return (
            <View
                style={{
                    paddingVertical: 25,
                }}
            >
                <ActivityIndicator
                    style={{
                        alignSelf: 'center',
                    }}
                />
            </View>
        );
    }

    const letterKeyboard = [
        ['q', 'w', 'e', 'r', 't', 'y', 'u', 'i', 'o', 'p'],
        ['a', 's', 'd', 'f', 'g', 'h', 'j', 'k', 'l'],
        ['uppercase', 'z', 'x', 'c', 'v', 'b', 'n', 'm', 'backspace'],
        ['switchType', '.', 'space', 'arrow-left', 'arrow-right'],
    ];

    const numberKeyboard = [
        ['1', '2', '3', '4', '5', '6', '7', '8', '9', '0'],
        ['/', '\\', ':', ';', '(', ')', '$', '&', '@', '"', "'"],
        ['%', '-', '+', '=', ',', '?', '!', '[', ']', 'backspace'],
        ['switchType', '.', 'space', 'arrow-left', 'arrow-right'],
    ];

    // MAIN RETURN
    return (
        <View
            style={{
                flexDirection: 'column',
                padding: Dimensions.get('window').width < 768 ? 20 : 25,
                backgroundColor: '#fff',
                width: '100%',
                height: '100%',
            }}
            className="mbsc-align-center mbsc-padding"
        >
            <View
                style={{
                    width: '100%',
                    backgroundColor: '#fff',
                }}
            >
                {/* Formula Input */}
                {/* <View style={{ padding: 10, width: '50%', backgroundColor: '#f8f8f8' }}>
                    <Text
                        style={{
                            fontSize: 16,
                            fontFamily: 'Inter',
                        }}
                    >
                        Enter formula
                    </Text>
                </View> */}
                <View
                    style={{
                        width: '100%',
                        marginBottom: Dimensions.get('window').width < 768 ? 10 : 20,
                        backgroundColor: '#fff',
                    }}
                >
                    <View
                        style={{
                            borderColor: '#ccc',
                            backgroundColor: '#fff',
                            borderWidth: 1,
                            borderRadius: 15,
                            padding: 10,
                            minWidth: 200,
                        }}
                    >
                        <EquationEditor
                            value={equation}
                            onChange={(eq: string) => setEquation(eq)}
                            autoCommands="bar overline sqrt sum prod int alpha beta gamma delta epsilon zeta eta theta iota kappa lambda mu nu xi omicron pi rho sigma tau upsilon phi chi psi omega Alpha Beta Gamma Delta Zeta Eta Theta Iota Kappa Lambda Mu Nu Xi Omicron Pi Rho Sigma Tau Upsilon Phi Chi Psi Omega lt lte gt gte"
                            autoOperatorNames="sin cos tan sec cosec arccos arcsin arctan lt lte gt gte"
                            addElementFromButton={addElementFromButton}
                            clearAddElementField={() => setAddElementFromButton('')}
                            // Custom props to disable virtual keyboard and use the custom keyboard
                            disableKeyboard={true}
                            typeFromButton={typeFromButton}
                            clearTypeFromButton={() => setTypeFromButton('')}
                            keystrokeFromButton={keystrokeFromButton}
                            clearKeystrokeFromButton={() => setKeystrokeFromButton('')}
                        />
                    </View>
                </View>

                <View
                    style={{
                        flexDirection: 'column',
                        backgroundColor: '#fff',
                    }}
                >
                    <View
                        style={{
                            paddingTop: 10,
                            marginBottom: 20,
                            flexDirection: 'row',
                            flexWrap: 'wrap',
                            backgroundColor: '#fff',
                        }}
                    >
                        {Object.keys(categoriesMap).map((cat: string, ind: number) => {
                            return (
                                <TouchableOpacity
                                    style={{
                                        backgroundColor: cat === activeTab ? '#000' : '#f2f2f2',
                                        borderRadius: 20,
                                        paddingHorizontal: 14,
                                        marginRight: 10,
                                        paddingVertical: 7,
                                        marginBottom: 10,
                                    }}
                                    onPress={() => {
                                        setActiveTab(cat);
                                    }}
                                    key={ind.toString()}
                                >
                                    <Text
                                        style={{
                                            color: cat === activeTab ? '#fff' : '#000',
                                            fontSize: 14,
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

                        if (cat === 'Keyboard' && cat === activeTab) {
                            return (
                                <View
                                    style={{
                                        display: 'flex',
                                        flexDirection: 'column',
                                        backgroundColor: '#fff',
                                        paddingBottom: 20,
                                    }}
                                    key={ind.toString()}
                                >
                                    <View
                                        style={{
                                            width: '100%',
                                            flexDirection: 'column',
                                            alignItems: 'center',
                                            // flexWrap: 'wrap',
                                            backgroundColor: '#fff',
                                        }}
                                    >
                                        {(isNumericKeyboard ? numberKeyboard : letterKeyboard).map(
                                            (row: any[], rowInd: number) => {
                                                return (
                                                    <View
                                                        style={{
                                                            width: '100%',
                                                            flexDirection: 'row',
                                                            justifyContent: 'center',
                                                            // flexWrap: 'wrap',
                                                            backgroundColor: '#fff',
                                                        }}
                                                    >
                                                        {row.map((sym: string, colInd: number) => {
                                                            if (!isNumericKeyboard && rowInd === 2 && colInd === 0) {
                                                                // Uppercase
                                                                return (
                                                                    <TouchableOpacity
                                                                        onPress={() => {
                                                                            setUppercase(!uppercase);
                                                                        }}
                                                                        style={{
                                                                            backgroundColor: '#f8f8f8',
                                                                            borderColor: '#CCC',
                                                                            borderWidth: 1,
                                                                            marginRight: 10,
                                                                            marginBottom: 10,
                                                                            paddingVertical:
                                                                                Dimensions.get('window').width < 768
                                                                                    ? 7
                                                                                    : 8,
                                                                            paddingHorizontal:
                                                                                Dimensions.get('window').width < 768
                                                                                    ? 10
                                                                                    : 12,
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
                                                                        <Ionicons
                                                                            name={
                                                                                uppercase
                                                                                    ? 'arrow-up-circle'
                                                                                    : 'arrow-up-circle-outline'
                                                                            }
                                                                            size={
                                                                                Dimensions.get('window').width < 768
                                                                                    ? 16
                                                                                    : 18
                                                                            }
                                                                        />
                                                                    </TouchableOpacity>
                                                                );
                                                            }

                                                            if (rowInd === 2 && colInd === row.length - 1) {
                                                                // backspace
                                                                return (
                                                                    <TouchableOpacity
                                                                        onPress={() => {
                                                                            setKeystrokeFromButton('Backspace');
                                                                        }}
                                                                        style={{
                                                                            backgroundColor: '#f8f8f8',
                                                                            borderColor: '#CCC',
                                                                            borderWidth: 1,
                                                                            marginRight: 10,
                                                                            marginBottom: 10,
                                                                            paddingVertical:
                                                                                Dimensions.get('window').width < 768
                                                                                    ? 7
                                                                                    : 10,
                                                                            paddingHorizontal:
                                                                                Dimensions.get('window').width < 768
                                                                                    ? 10
                                                                                    : 15,
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
                                                                        <Ionicons
                                                                            name={'backspace'}
                                                                            size={
                                                                                Dimensions.get('window').width < 768
                                                                                    ? 16
                                                                                    : 18
                                                                            }
                                                                        />
                                                                    </TouchableOpacity>
                                                                );
                                                            }

                                                            if (rowInd === 3 && colInd === 0) {
                                                                // backspace
                                                                return (
                                                                    <TouchableOpacity
                                                                        onPress={() => {
                                                                            setIsNumericKeyboard(!isNumericKeyboard);
                                                                        }}
                                                                        style={{
                                                                            backgroundColor: '#f8f8f8',
                                                                            borderColor: '#CCC',
                                                                            borderWidth: 1,
                                                                            marginRight: 10,
                                                                            marginBottom: 10,
                                                                            paddingVertical:
                                                                                Dimensions.get('window').width < 768
                                                                                    ? 7
                                                                                    : 10,
                                                                            paddingHorizontal:
                                                                                Dimensions.get('window').width < 768
                                                                                    ? 10
                                                                                    : 15,
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
                                                                                backgroundColor: '#f8f8f8',
                                                                                fontSize:
                                                                                    Dimensions.get('window').width < 768
                                                                                        ? 12
                                                                                        : 15,
                                                                            }}
                                                                        >
                                                                            {isNumericKeyboard ? 'ABC' : '123'}
                                                                        </Text>
                                                                    </TouchableOpacity>
                                                                );
                                                            }

                                                            if (rowInd === 3 && colInd === 2) {
                                                                // backspace
                                                                return (
                                                                    <TouchableOpacity
                                                                        onPress={() => {
                                                                            setKeystrokeFromButton('Spacebar');
                                                                        }}
                                                                        style={{
                                                                            maxWidth: 400,
                                                                            backgroundColor: '#f8f8f8',
                                                                            borderColor: '#CCC',
                                                                            borderWidth: 1,
                                                                            marginRight: 10,
                                                                            marginBottom: 10,
                                                                            paddingVertical:
                                                                                Dimensions.get('window').width < 768
                                                                                    ? 7
                                                                                    : 10,
                                                                            paddingHorizontal:
                                                                                Dimensions.get('window').width < 768
                                                                                    ? 10
                                                                                    : 15,
                                                                            borderRadius: 10,
                                                                            shadowOffset: {
                                                                                width: 1,
                                                                                height: 1,
                                                                            },
                                                                            overflow: 'hidden',
                                                                            shadowOpacity: 0.03,
                                                                            shadowRadius: 3,
                                                                            flex: 1,
                                                                            justifyContent: 'center',
                                                                            flexDirection: 'row',
                                                                        }}
                                                                        key={ind.toString()}
                                                                    >
                                                                        <Text
                                                                            style={{
                                                                                backgroundColor: '#f8f8f8',
                                                                                fontSize:
                                                                                    Dimensions.get('window').width < 768
                                                                                        ? 12
                                                                                        : 15,
                                                                            }}
                                                                        >
                                                                            {sym}
                                                                        </Text>
                                                                    </TouchableOpacity>
                                                                );
                                                            }

                                                            if (rowInd === 3 && (colInd === 3 || colInd === 4)) {
                                                                // backspace
                                                                return (
                                                                    <TouchableOpacity
                                                                        onPress={() => {
                                                                            setKeystrokeFromButton(
                                                                                colInd === 3 ? 'Left' : 'Right'
                                                                            );
                                                                        }}
                                                                        style={{
                                                                            backgroundColor: '#f8f8f8',
                                                                            borderColor: '#CCC',
                                                                            borderWidth: 1,
                                                                            marginRight: 10,
                                                                            marginBottom: 10,
                                                                            paddingVertical:
                                                                                Dimensions.get('window').width < 768
                                                                                    ? 7
                                                                                    : 10,
                                                                            paddingHorizontal:
                                                                                Dimensions.get('window').width < 768
                                                                                    ? 10
                                                                                    : 15,
                                                                            borderRadius: 10,
                                                                            shadowOffset: {
                                                                                width: 1,
                                                                                height: 1,
                                                                            },
                                                                            overflow: 'hidden',
                                                                            shadowOpacity: 0.03,
                                                                            shadowRadius: 3,
                                                                            justifyContent: 'center',
                                                                            flexDirection: 'row',
                                                                        }}
                                                                        key={ind.toString()}
                                                                    >
                                                                        <Ionicons
                                                                            name={
                                                                                colInd === 3
                                                                                    ? 'caret-back-outline'
                                                                                    : 'caret-forward-outline'
                                                                            }
                                                                            size={
                                                                                Dimensions.get('window').width < 768
                                                                                    ? 14
                                                                                    : 16
                                                                            }
                                                                        />
                                                                    </TouchableOpacity>
                                                                );
                                                            }

                                                            return (
                                                                <TouchableOpacity
                                                                    onPress={() => {
                                                                        setTypeFromButton(
                                                                            uppercase ? sym.toUpperCase() : sym
                                                                        );
                                                                    }}
                                                                    style={{
                                                                        backgroundColor: '#f8f8f8',
                                                                        borderColor: '#CCC',
                                                                        borderWidth: 1,
                                                                        marginRight: 10,
                                                                        marginBottom: 10,
                                                                        paddingVertical:
                                                                            Dimensions.get('window').width < 768
                                                                                ? 7
                                                                                : 10,
                                                                        paddingHorizontal:
                                                                            Dimensions.get('window').width < 768
                                                                                ? 10
                                                                                : 15,
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
                                                                            backgroundColor: '#f8f8f8',
                                                                            fontSize:
                                                                                Dimensions.get('window').width < 768
                                                                                    ? 12
                                                                                    : 15,
                                                                        }}
                                                                    >
                                                                        {uppercase ? sym.toUpperCase() : sym}
                                                                    </Text>
                                                                </TouchableOpacity>
                                                            );
                                                        })}
                                                    </View>
                                                );
                                            }
                                        )}
                                    </View>
                                </View>
                            );
                        }

                        return (
                            <View
                                style={{
                                    display: 'flex',
                                    flexDirection: 'column',
                                    backgroundColor: '#fff',
                                    paddingBottom: 20,
                                }}
                                key={ind.toString()}
                            >
                                <View
                                    style={{
                                        width: '100%',
                                        flexDirection: 'row',
                                        flexWrap: 'wrap',
                                        backgroundColor: '#fff',
                                    }}
                                >
                                    {categoriesMap[cat].map((sym: string, ind: number) => {
                                        return (
                                            <TouchableOpacity
                                                onPress={() => {
                                                    setAddElementFromButton(symbolsMap[sym]);
                                                }}
                                                style={{
                                                    backgroundColor: '#f8f8f8',
                                                    borderColor: '#CCC',
                                                    borderWidth: 1,
                                                    marginRight: 10,
                                                    marginBottom: 10,
                                                    paddingVertical: Dimensions.get('window').width < 768 ? 7 : 10,
                                                    paddingHorizontal: Dimensions.get('window').width < 768 ? 10 : 15,
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
                                                        backgroundColor: '#f8f8f8',
                                                        fontSize: Dimensions.get('window').width < 768 ? 12 : 15,
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

                {/* Insert button */}

                {showInsertButton ? (
                    <View
                        style={{
                            width: '100%',
                            flexDirection: 'row',
                            justifyContent: 'center',
                        }}
                    >
                        <TouchableOpacity
                            onPress={() => {
                                // Render Mathjax and update the uri
                                renderMathjax(equation).then((res: any) => {
                                    const random = Math.random();

                                    const equationImg =
                                        '<img class="rendered-math-jax" style="width:' +
                                        res.intrinsicWidth +
                                        'px; id="' +
                                        random +
                                        '" data-eq="' +
                                        encodeURIComponent(equation) +
                                        '" src="' +
                                        res.imgSrc +
                                        '"></img>';

                                    var url = window.location.href;
                                    var urlSplit = url.split('?');

                                    var obj = {
                                        title: 'New title',
                                        url:
                                            urlSplit[0] +
                                            '?equationImageURL=' +
                                            encodeURIComponent(equationImg) +
                                            (showInsertButton ? '&showInsertButton=true' : ''),
                                    };
                                    window.history.pushState(obj, obj.title, obj.url);
                                });
                            }}
                            // disabled={equation !== ''}
                        >
                            <Text
                                style={{
                                    fontWeight: 'bold',
                                    textAlign: 'center',
                                    borderColor: '#000',
                                    borderWidth: 1,
                                    color: '#fff',
                                    backgroundColor: '#000',
                                    fontSize: 11,
                                    paddingHorizontal: 24,
                                    fontFamily: 'inter',
                                    overflow: 'hidden',
                                    paddingVertical: 14,
                                    textTransform: 'uppercase',
                                    width: 175,
                                }}
                            >
                                Insert
                            </Text>
                        </TouchableOpacity>
                    </View>
                ) : null}
            </View>
        </View>
    );
}
