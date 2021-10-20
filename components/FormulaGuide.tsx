import React, { useState, useEffect } from 'react';
import { ScrollView } from 'react-native';
import { View } from './Themed'
import { Popup } from '@mobiscroll/react'
import EquationEditor from 'equation-editor-react';


const FormulaGuide: React.FunctionComponent<{ [label: string]: any }> = (props: any) => {

    const symbols = [
        {
            symbol: 'Superscript',
            howTo: '^     (shift + 6)'
        },
        {
            symbol: 'Subscript',
            howTo: '_    (shift + -)'
        },
        {
            symbol: 'Summation Σ',
            howTo: 'sum'
        },
        {
            symbol: 'Product ∏',
            howTo: 'prod'
        },
        {
            symbol: 'Square root √',
            howTo: 'sqrt'
        },
        {
            symbol: 'bar over letter',
            howTo: 'bar'
        },
        {
            symbol: 'α, β, γ, δ, etc.',
            howTo: 'alpha, beta, gamma, delta, etc. (Lowercase)'
        },
        {
            symbol: 'Γ, Δ, Ε, Ω, etc.',
            howTo: 'Gamma, Delta, Epsilon, Omega, etc. (Uppercase)'
        },
    ]
    return <Popup isOpen={props.show} 
                // buttons={['ok']} 
                buttons={[
                    { 
                        text:'ADD',
                        handler: function (event) {
                            props.onInsertEquation()
                        }
                    }, {
                    text: 'CANCEL',
                    handler: function (event) {
                        props.onClose()
                    }
                },]}
                themeVariant="light" 
                onClose={() => props.onClose()} 
                responsive={{
                        small: {
                            display: 'bottom'
                        },
                        medium: { // Custom breakpoint
                            display: 'center'
                        },
                    
                }}
            >
                <View style={{ flexDirection: 'column', padding: 25,  backgroundColor: '#f2f2f7' }} className="mbsc-align-center mbsc-padding">
                    <ScrollView
                        showsVerticalScrollIndicator={false}
                        horizontal={false}
                        contentContainerStyle={{
                            width: '100%',
                            maxHeight: 500
                        }}
                    >
                        {/* Formula Input */}
                        <View
                            style={{
                            width: "100%",
                            // flexDirection: width < 1024 ? "column" : "row",
                            marginBottom: 20,
                            backgroundColor: '#f2f2f7'
                            }}
                        >
                            <View
                                style={{
                                    borderColor: "#C4C4C4",
                                    borderWidth: 1,
                                    borderRadius: 15,
                                    padding: 10,
                                    minWidth: 200,
                                    // maxWidth: "50%",
                                }}
                            >
                                <EquationEditor
                                    value={props.equation}
                                    onChange={props.onChange}
                                    autoCommands="bar overline sqrt sum prod int alpha beta gamma delta epsilon zeta eta theta iota kappa lambda mu nu xi omikron pi rho sigma tau upsilon phi chi psi omega Alpha Beta Gamma Aelta Epsilon Zeta Eta Theta Iota Kappa Lambda Mu Nu Xi Omikron Pi Rho Sigma Tau Upsilon Phi Chi Psi Omega Delta"
                                    autoOperatorNames="sin cos tan arccos arcsin arctan"
                                />
                            </View>
                        </View>
                        {/* Guide */}
                        <View style={{ width: '100%', flexDirection: 'row', backgroundColor: '#f2f2f7', borderBottomWidth: 1, borderBottomColor: '#C4C4C4' }}>
                               <View style={{ padding: 10, width: '50%',  backgroundColor: '#f2f2f7' }}>
                                   Symbol
                               </View>
                               <View style={{ padding: 10, width: '50%',  backgroundColor: '#f2f2f7' }}>
                                   Keyboard command
                               </View>
                        </View>
                       {symbols.map((s: any) => {
                           return (<View key={JSON.stringify(s)} style={{ width: '100%', flexDirection: 'row',  backgroundColor: '#f2f2f7' }}>
                               <View style={{ padding: 10, width: '50%',  backgroundColor: '#f2f2f7' }}>
                                   {s.symbol}
                               </View>
                               <View style={{ padding: 10, width: '50%',  backgroundColor: '#f2f2f7' }}>
                                   {s.howTo}
                               </View>
                           </View>)
                       })}
                    </ScrollView>
                </View>
            </Popup>;
}

export default FormulaGuide;