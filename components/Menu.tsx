import React, { useState, useRef, useEffect } from 'react';
import { StyleSheet, Animated } from 'react-native';
import { Picker } from '@react-native-picker/picker';
import { Text, View } from '../components/Themed';
import { Ionicons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import { shuffleFrequencyOptions } from '../helpers/FrequencyOptions';

const Menu: React.FunctionComponent<{ [label: string]: any }> = (props: any) => {

    const [modalAnimation] = useState(new Animated.Value(0))

    useEffect(() => {
        Animated.timing(modalAnimation, {
            toValue: 1,
            duration: 150,
            useNativeDriver: true
        }).start();
    }, [])

    return (
        <View style={{
            width: '100%', height: '100%', backgroundColor: 'white'
        }}>
            <Animated.View style={{ ...styles.container, opacity: modalAnimation }}>
                <Text style={{ width: '100%', textAlign: 'center', height: 15, paddingBottom: 10 }}>
                    <Ionicons name='chevron-down' size={20} color={'#e0e0e0'} />
                </Text>
                <View style={{ ...styles.row, height: '70%' }}>
                    <View style={{
                        backgroundColor: 'white',
                        width: '100%',
                        flexDirection: 'row',
                        justifyContent: 'center'
                    }}>
                        <View style={{ height: '100%', justifyContent: 'center', backgroundColor: 'white', width: '50%', paddingRight: 7.5 }}>
                            <Text style={styles.text}>
                                Remind <Ionicons name='shuffle-outline' size={15} /> every
                        </Text>
                        </View>
                        <View style={{ height: '100%', justifyContent: 'center', backgroundColor: 'white', width: '50%', paddingLeft: 7.5 }}>
                            <Picker
                                style={{
                                    ...styles.picker
                                }}
                                itemStyle={{
                                    width: 110,
                                    fontSize: 18
                                }}
                                selectedValue={props.randomShuffleFrequency}
                                onValueChange={(itemValue: any) =>
                                    props.setRandomShuffleFrequency(itemValue)
                                }
                            >
                                {
                                    shuffleFrequencyOptions.map((item: any, index: number) => {
                                        return <Picker.Item
                                            color={props.randomShuffleFrequency === item.value ? '#0079FE' : "#101010"}
                                            label={item.label}
                                            value={item.value}
                                            key={index}
                                        />
                                    })
                                }
                            </Picker>
                        </View>
                    </View>
                </View>
                <View style={{ ...styles.row, height: '40%' }}>
                    <View style={{
                        backgroundColor: 'white',
                        width: '100%',
                        flexDirection: 'row',
                        justifyContent: 'center'
                    }}>
                        <Text style={{ ...styles.text, padding: 12, paddingLeft: 0 }}>
                            <Ionicons name='bed-outline' size={15} />  from
                    </Text>
                        <DateTimePicker
                            style={styles.timePicker}
                            value={props.sleepFrom}
                            mode={'time'}
                            is24Hour={true}
                            textColor={'#101010'}
                            onChange={(event, selectedDate) => {
                                const currentDate = selectedDate;
                                props.setSleepFrom(currentDate)
                            }}
                        />
                        <Text style={{
                            ...styles.text,
                            textAlign: 'center',
                            padding: 10
                        }}>
                            to
                    </Text>
                        <DateTimePicker
                            style={styles.timePicker}
                            value={props.sleepTo}
                            mode={'time'}
                            is24Hour={true}
                            textColor={'#101010'}
                            onChange={(event, selectedDate) => {
                                const currentDate = selectedDate;
                                props.setSleepTo(currentDate)
                            }}
                        />
                    </View>
                </View>
            </Animated.View>
        </View>
    );
}

export default Menu

const styles = StyleSheet.create({
    container: {
        width: '100%',
        height: '100%',
        backgroundColor: 'white',
        display: 'flex',
        flexDirection: 'column',
        padding: 15,
        paddingTop: 5,
    },
    row: {
        width: '100%',
        height: '50%',
        display: 'flex',
        flexDirection: 'row'
    },
    col1: {
        width: '50%',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        backgroundColor: 'white',
        paddingRight: 7.5
    },
    col2: {
        width: '50%',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        backgroundColor: 'white',
        paddingLeft: 7.5
    },
    picker: {
        width: 150,
        height: 200,
        display: 'flex',
        justifyContent: 'center',
        backgroundColor: 'white',
        overflow: 'hidden',
        fontSize: 14,
        textAlign: 'center'
    },
    timePicker: {
        width: 95,
        fontSize: 18,
        height: 45,
        color: '#101010'
    },
    text: {
        fontSize: 18,
        color: '#a6a2a2',
        textAlign: 'right',
    }
});
