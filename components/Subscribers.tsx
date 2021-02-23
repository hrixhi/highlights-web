import React, { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Animated, Dimensions, Alert } from 'react-native';
import { View } from './Themed';
import { ScrollView } from 'react-native-gesture-handler'
import { fetchAPI } from '../graphql/FetchAPI';
import { getSubscribers } from '../graphql/QueriesAndMutations';
import SubscribersList from './SubscribersList';

const Subscribers: React.FunctionComponent<{ [label: string]: any }> = (props: any) => {

    const [modalAnimation] = useState(new Animated.Value(1))
    const [loading, setLoading] = useState(true)
    const [subscribers, setSubscribers] = useState<any[]>([])

    const loadSubscribers = useCallback(() => {
        setLoading(true)
        if (props.channelId && props.channelId !== '') {
            const server = fetchAPI('')
            server.query({
                query: getSubscribers,
                variables: {
                    channelId: props.channelId
                }
            })
                .then(res => {
                    if (res.data.user && res.data.user.findByChannelId) {
                        setSubscribers(res.data.user.findByChannelId)
                    }
                    setLoading(false)
                    modalAnimation.setValue(0)
                    Animated.timing(modalAnimation, {
                        toValue: 1,
                        duration: 150,
                        useNativeDriver: true
                    }).start();
                })
                .catch((err) => {
                    Alert.alert("Unable to load subscribers.", "Check connection.")
                    setLoading(false)
                    modalAnimation.setValue(0)
                    Animated.timing(modalAnimation, {
                        toValue: 1,
                        duration: 150,
                        useNativeDriver: true
                    }).start();
                })
        } else {
            setLoading(false)
            modalAnimation.setValue(0)
            Animated.timing(modalAnimation, {
                toValue: 1,
                duration: 150,
                useNativeDriver: true
            }).start();
        }
    }, [props.channelId, modalAnimation])

    useEffect(() => {
        loadSubscribers()
    }, [props.channelId])

    const windowHeight = Dimensions.get('window').height;

    return (
        <ScrollView style={{
            width: '100%',
            height: '100%',
            backgroundColor: 'white',
            borderTopRightRadius: 25,
            borderTopLeftRadius: 25,
            // borderColor: '#eaeaea',
            // borderWidth: 1,
            // borderBottomWidth: 0
        }}
            showsVerticalScrollIndicator={false}
            onScroll={e => {
                if (e.nativeEvent.contentOffset.y < -85) {
                    Animated.timing(modalAnimation, {
                        toValue: 0,
                        duration: 150,
                        useNativeDriver: true
                    })
                        .start(() => {
                            props.closeModal()
                        })
                }
            }}
            scrollEnabled={true}
            scrollEventThrottle={1}
            keyboardDismissMode={'on-drag'}
            overScrollMode={'always'}
            nestedScrollEnabled={true}
        >
            <Animated.View style={{
                opacity: modalAnimation,
                width: '100%',
                height: windowHeight,
                backgroundColor: 'white'
            }}>
                {
                    loading
                        ? <View style={{
                            width: '100%',
                            flex: 1,
                            justifyContent: 'center',
                            display: 'flex',
                            flexDirection: 'column',
                            backgroundColor: 'white',
                        }}>
                            <ActivityIndicator color={'#a6a2a2'} />
                        </View>
                        :
                        <SubscribersList
                            key={JSON.stringify(subscribers)}
                            subscribers={subscribers}
                            cueId={null}
                            channelName={props.filterChoice}
                            channelId={props.channelId}
                            closeModal={() => {
                                Animated.timing(modalAnimation, {
                                    toValue: 0,
                                    duration: 150,
                                    useNativeDriver: true
                                }).start(() => props.closeModal())
                            }}
                            reload={() => loadSubscribers()}
                        />
                }
            </Animated.View>
        </ScrollView>
    );
}

export default Subscribers