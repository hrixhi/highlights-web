// REACT
import React, { useState } from 'react';
import { ScrollView, Touchable, Text, Dimensions } from 'react-native';

// COMPONENTS
import { View, TouchableOpacity } from './Themed';
import { Popup } from '@mobiscroll/react';
import EquationEditor from 'equation-editor-react';
import { Ionicons } from '@expo/vector-icons';

const EquationEditorQuiz: React.FunctionComponent<{ [label: string]: any }> = (props: any) => {
    const [addElementFromButton, setAddElementFromButton] = useState('');
    const [clearField, setClearField] = useState(false);

    // const svgX2 = <svg version="1.0" xmlns="http://www.w3.org/2000/svg" width="300" height="300" viewBox="0 0 300.000000 300.000000" preserveAspectRatio="xMidYMid " class="svg" style="width: 256px; height: 256px;">
    //         <g transform="translate(0.000000,300.000000) scale(0.100000,-0.100000)" fill="#171717" stroke="none">
    //         <path d="M2555 2750 c-3 -5 -23 -14 -44 -20 -22 -6 -66 -28 -99 -50 -117 -78
    //         -137 -196 -42 -245 69 -36 110 -8 78 53 -21 41 -24 109 -6 147 16 36 95 75
    //         151 75 91 0 187 -67 208 -145 31 -115 -32 -249 -188 -396 -75 -71 -203 -177
    //         -235 -195 -37 -22 -88 -78 -88 -97 0 -19 5 -20 118 -13 177 11 336 11 448 2
    //         124 -11 147 -3 142 51 -2 29 -9 39 -38 54 -57 31 -237 25 -410 -13 -81 -18
    //         -108 -20 -114 -10 -5 8 60 60 252 204 70 53 189 188 222 253 29 56 32 72 32
    //         145 -1 78 -3 84 -35 123 -58 71 -100 87 -232 87 -63 0 -117 -4 -120 -10z" id="node1" class="node"></path>
    //         <path d="M1343 1905 c-54 -27 -89 -54 -140 -109 -64 -69 -148 -183 -183 -251
    //         -70 -133 -105 -185 -124 -185 -7 0 -26 44 -45 98 -66 194 -143 377 -176 414
    //         -13 15 -40 34 -60 42 -59 25 -73 24 -280 -32 -49 -13 -105 -27 -123 -32 -44
    //         -11 -62 -28 -62 -57 0 -24 2 -25 42 -19 24 4 79 9 123 12 78 6 81 5 129 -28
    //         55 -36 96 -105 136 -221 11 -34 24 -71 29 -82 14 -32 37 -93 71 -190 17 -49
    //         38 -105 46 -123 16 -37 18 -88 5 -97 -6 -3 -20 -27 -33 -52 -37 -76 -174 -254
    //         -235 -306 -88 -76 -125 -91 -218 -91 -44 0 -97 6 -117 13 -50 17 -69 9 -101
    //         -40 -29 -44 -35 -99 -14 -126 64 -82 106 -100 208 -89 69 7 115 29 185 88 102
    //         87 186 194 296 376 34 56 67 107 74 113 9 7 18 1 33 -24 12 -19 21 -39 21 -44
    //         0 -10 22 -61 42 -97 6 -11 21 -48 33 -82 38 -106 131 -244 195 -290 43 -31 49
    //         -33 140 -33 81 -1 107 3 185 30 49 17 95 35 100 39 6 4 21 11 35 15 47 15 100
    //         55 100 75 0 26 -25 36 -53 22 -12 -6 -46 -16 -75 -21 -221 -45 -344 60 -481
    //         409 -18 47 -37 93 -43 103 -19 38 -58 155 -58 176 0 24 44 116 84 174 14 21
    //         26 40 26 43 0 9 44 70 90 123 51 60 137 122 192 138 51 15 123 0 176 -37 51
    //         -36 52 -36 76 -9 29 34 47 87 48 139 2 61 -27 102 -93 135 -69 35 -118 33
    //         -206 -10z" id="node2" class="node"></path>
    //         </g>
    //         <g transform="translate(0.000000,300.000000) scale(0.100000,-0.100000)" fill="#A1A1A1" stroke="none">

    //         </g>
    //         </svg>

    // const lambdaSymbol = <svg version="1.0" xmlns="http://www.w3.org/2000/svg" width="300" height="300" viewBox="0 0 204.000000 300.000000" preserveAspectRatio="xMidYMid " class="svg" style="width: 256px; height: 256px;">
    // <g transform="translate(0.000000,300.000000) scale(0.100000,-0.100000)" fill="#060606" stroke="none">
    // <path class="node" id="node1" d="M437 2989 c-173 -41 -316 -283 -334 -566 l-6 -93 31 0 c25 0 33 5 36
    // 23 32 163 68 237 140 286 63 42 105 56 172 55 166 -1 284 -168 372 -524 56
    // -227 72 -159 -151 -642 -108 -233 -213 -461 -235 -508 -22 -47 -66 -141 -97
    // -210 -96 -209 -200 -432 -299 -644 -31 -65 -56 -123 -56 -127 0 -5 86 -9 191
    // -9 l190 0 19 43 c70 159 185 422 260 592 127 289 189 430 265 605 37 85 71
    // 159 76 164 10 11 18 -25 160 -679 56 -257 103 -416 155 -522 49 -100 92 -147
    // 171 -186 216 -109 409 -12 498 248 17 52 44 232 45 298 0 38 0 38 -37 35 -37
    // -3 -38 -4 -45 -55 -27 -184 -132 -286 -282 -270 -143 14 -240 126 -320 368
    // -19 57 -67 246 -106 419 -39 173 -93 416 -121 540 -207 916 -274 1131 -394
    // 1255 -94 96 -189 130 -298 104z"></path>
    // </g>
    // <g transform="translate(0.000000,300.000000) scale(0.100000,-0.100000)" fill="#A1A1A1" stroke="none">

    // </g>
    // </svg>

    const symbols = [
        '+',
        '-',
        '×',
        '÷',
        '±',
        '=',
        'Superscript',
        'Subscript',
        'Degree °',
        'Bar over letter',
        'Sum Σ',
        'Product ∏',
        'Integral ∫',
        'Fraction',
        '√',
        // '∛',
        '<',
        '≤',
        '>',
        '≥',
        'π',
    ];

    const symbolsMap = {
        '+': '+',
        '-': '-',
        '×': '×',
        '÷': '÷',
        '±': '±',
        '=': '=',
        'Degree °': `\circ`,
        Superscript: '^',
        Subscript: '_',
        'Bar over letter': 'bar',
        'Sum Σ': 'sum',
        'Product ∏': 'prod',
        'Integral ∫': 'int',
        '<': `<`,
        '≤': `\leq`,
        '>': `>`,
        '≥': `\geq`,
        Fraction: '/',
        π: 'pi',
        '¼': '¼',
        '½': '½',
        '¾': '¾',
        '√': 'sqrt',
        // '∛': '\\nthroot3',
    };

    return (
        <View
            style={{
                backgroundColor: '#f8f8f8',
            }}
        >
            {/* <Text style={{ padding: 10, width: '50%', fontFamily: 'Inter', fontSize: 20  }}></Text> */}
            <View
                style={{
                    width: '100%',
                    marginBottom: 40,
                    marginTop: 20,
                    backgroundColor: '#f8f8f8',
                }}
            >
                <View
                    style={{
                        backgroundColor: '#fff',
                        borderColor: '#CCC',
                        borderWidth: 1,
                        borderRadius: 15,
                        padding: 10,
                        width: Dimensions.get('window').width < 768 ? 300 : 600,
                        maxWidth: Dimensions.get('window').width < 768 ? 300 : 600,
                        marginBottom: 20,
                    }}
                >
                    <EquationEditor
                        value={props.equation}
                        onChange={props.onChange}
                        autoCommands="bar overline sqrt sum prod int alpha beta gamma delta epsilon zeta eta theta iota kappa lambda mu nu xi omicron pi rho sigma tau upsilon phi chi psi omega Alpha Beta Gamma Delta Zeta Eta Theta Iota Kappa Lambda Mu Nu Xi Omicron Pi Rho Sigma Tau Upsilon Phi Chi Psi Omega lt lte gt gte nthroot"
                        autoOperatorNames="sin cos tan sec cosec arccos arcsin arctan lt lte gt gte nthroot"
                        addElementFromButton={addElementFromButton}
                        clearAddElementField={() => setAddElementFromButton('')}
                        clearField={clearField}
                        resetClearField={() => setClearField(false)}
                    />
                </View>

                <View
                    style={{
                        width: Dimensions.get('window').width < 768 ? 300 : 600,
                        flexDirection: 'row',
                        flexWrap: 'wrap',
                        backgroundColor: '#f8f8f8',
                    }}
                >
                    {symbols.map((sym: string) => {
                        return (
                            <TouchableOpacity
                                onPress={() => {
                                    setAddElementFromButton(symbolsMap[sym]);
                                }}
                                style={{
                                    borderColor: '#ccc',
                                    borderWidth: 1,
                                    marginRight: 12,
                                    marginBottom: 12,
                                }}
                            >
                                <Text
                                    style={{
                                        paddingHorizontal: 12,
                                        paddingVertical: 7,
                                        backgroundColor: 'white',
                                    }}
                                >
                                    {sym}
                                </Text>
                            </TouchableOpacity>
                        );
                    })}
                    <TouchableOpacity
                        onPress={() => {
                            setClearField(true);
                        }}
                        style={{
                            paddingTop: 2,
                            paddingLeft: 5,
                            marginRight: 12,
                            marginBottom: 12,
                            backgroundColor: '#f8f8f8',
                        }}
                    >
                        <Ionicons name="trash-outline" size={24} color={'#000'} />
                    </TouchableOpacity>
                </View>
            </View>
        </View>
    );
};

export default EquationEditorQuiz;
