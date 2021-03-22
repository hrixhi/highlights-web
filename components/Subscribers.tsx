import React, { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Animated, Dimensions } from 'react-native';
import Alert from '../components/Alert'
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
                    Alert("Unable to load subscribers.", "Check connection.")
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

    const windowHeight = Dimensions.get('window').height - 30;

    return (
        <ScrollView style={{
            width: '100%',
            height: windowHeight - 30,
            backgroundColor: 'white',
            borderTopRightRadius: 30,
            borderTopLeftRadius: 30
        }}
            showsVerticalScrollIndicator={false}
            scrollEnabled={true}
            scrollEventThrottle={1}
            keyboardDismissMode={'on-drag'}
            overScrollMode={'always'}
            nestedScrollEnabled={true}
        >
            <Animated.View style={{
                opacity: modalAnimation,
                width: '100%',
                height: windowHeight - 30,
                backgroundColor: 'white',
                borderTopRightRadius: 30,
                borderTopLeftRadius: 30
            }}>
                {
                    loading
                        ? <View style={{
                            width: '100%',
                            flex: 1,
                            justifyContent: 'center',
                            display: 'flex',
                            flexDirection: 'column',
                            backgroundColor: 'white'
                        }}>
                            <ActivityIndicator color={'#a6a2a2'} />
                        </View>
                        :
                        <SubscribersList
                            channelCreatedBy={props.channelCreatedBy}
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