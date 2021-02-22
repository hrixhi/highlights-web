import React from 'react';
import { StyleSheet } from 'react-native';
import { Text, View } from './Themed';
import _ from 'lodash'
// import HTMLView from 'react-native-htmlview';

const ThreadReplyCard: React.FunctionComponent<{ [label: string]: any }> = (props: any) => {

    const styleObject = styles()
    return (
        <View
            key={'textPage'}
            style={styleObject.card}>
            <View style={styleObject.text}>
                <View style={styleObject.dateContainer}>
                    <Text style={styleObject.date}>
                        {
                            (new Date(props.thread.time)).toString().split(' ')[1] +
                            ' ' +
                            (new Date(props.thread.time)).toString().split(' ')[2]
                        }
                    </Text>
                    <Text style={{
                        fontSize: 10,
                        color: '#a6a2a2',
                        marginRight: 5,
                        flex: 1,
                        textAlign: 'right'
                    }}>
                        {props.thread.anonymous ? 'Anonymous' : props.thread.displayName}
                    </Text>
                </View>
                {/* <HTMLView value={props.thread.message}/> */}
            </View>
        </View>
    );
}

export default React.memo(ThreadReplyCard, (prev, next) => {
    return _.isEqual({ ...prev.thread }, { ...next.thread })
})

const styles: any = () => StyleSheet.create({
    card: {
        width: '100%',
        borderRadius: 20,
        padding: 13,
        paddingBottom: 20,
        backgroundColor: '#F4F4F4'
    },
    text: {
        display: 'flex',
        flexDirection: 'column',
        flex: 1,
        backgroundColor: '#F4F4F4',
    },
    dateContainer: {
        fontSize: 10,
        color: '#a6a2a2',
        backgroundColor: '#F4F4F4',
        display: 'flex',
        flexDirection: 'row',
        paddingBottom: 10
    },
    date: {
        fontSize: 10,
        color: '#a6a2a2',
        marginLeft: 5
    }
});
