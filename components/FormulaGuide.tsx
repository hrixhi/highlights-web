import React, { useState, useEffect } from 'react';
import { ScrollView } from 'react-native';
import { View } from './Themed'
import { Popup } from '@mobiscroll/react'


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
                buttons={['ok']} 
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
                        <View style={{ width: '100%', flexDirection: 'row', backgroundColor: '#f2f2f7', borderBottomWidth: 1, borderBottomColor: '#cccccc' }}>
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