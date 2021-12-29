import AsyncStorage from '@react-native-async-storage/async-storage';
import { StackScreenProps } from '@react-navigation/stack';
import React, { useEffect, useState, useRef } from 'react';
import { View, Text } from '../components/Themed';
import { Platform, Alert } from 'react-native';
import alert from '../components/Alert';
import { fetchAPI } from '../graphql/FetchAPI';
import { fetchAnnotationsForViewer, updateAnnotationsFromViewer } from '../graphql/QueriesAndMutations';
import WebViewer from '@pdftron/pdfjs-express';
import { ActivityIndicator, StyleSheet } from 'react-native';

export default function PDFViewerCues({ navigation, route }: StackScreenProps<any, 'pdfviewer'>) {
    const [invalidParams, setInvalidParams] = useState(false);
    const [url, setUrl] = useState('');
    const [cueId, setCueId] = useState('');
    const [userId, setUserId] = useState('');
    const [annotations, setAnnotations] = useState('');
    const [source, setSource] = useState('');
    const [name, setName] = useState('');
    const [releaseSubmission, setReleaseSubmission] = useState(false);
    const RichText: any = useRef();
    const [loading, setLoading] = useState(true);

    console.log('Annotations', annotations);

    useEffect(() => {
        if (Platform.OS === 'web') {
            // check URL over here

            const urlParam = route?.params?.url;
            const userIdParam = route?.params?.userId;
            const cueIdParam = route?.params?.cueId;
            const sourceParam = route?.params?.source;
            const nameParam = route?.params?.name;

            console.log('url', urlParam);
            console.log('User id', userIdParam);
            console.log('Cue id', cueIdParam);
            console.log('Source', sourceParam);
            console.log('Name', nameParam);

            if (!urlParam || !sourceParam) {
                setInvalidParams(true);
                return;
            } else {
                setInvalidParams(false);
            }

            setUrl(urlParam);
            setCueId(cueIdParam);
            setUserId(userIdParam);
            setSource(sourceParam);
            setName(decodeURIComponent(nameParam));

            if (sourceParam === 'CREATE') {
                setLoading(false);
                return;
            } else if (sourceParam === 'UPDATE') {
                const server = fetchAPI('');
                server
                    .query({
                        query: fetchAnnotationsForViewer,
                        variables: {
                            cueId: cueIdParam,
                            userId: userIdParam
                        }
                    })
                    .then(async res => {
                        console.log('Annotations result', res.data);

                        if (
                            res.data &&
                            res.data.user.fetchAnnotationsForViewer !== undefined &&
                            res.data.user.fetchAnnotationsForViewer !== null
                        ) {
                            const annot = res.data.user.fetchAnnotationsForViewer.annotations;

                            setAnnotations(annot ? annot : '');
                        } else {
                            // No cue attached to URL so then don't render file
                            setInvalidParams(true);
                        }
                        setLoading(false);
                    })
                    .catch(err => {
                        setLoading(false);
                        setInvalidParams(true);
                        console.log(err);
                    });
            } else if (sourceParam === 'VIEW_SUBMISSION' || sourceParam === 'FEEDBACK') {
                //
                const server = fetchAPI('');
                server
                    .query({
                        query: fetchAnnotationsForViewer,
                        variables: {
                            cueId: cueIdParam,
                            userId: userIdParam
                        }
                    })
                    .then(async res => {
                        console.log('Annotations result', res.data);

                        if (
                            res.data &&
                            res.data.user.fetchAnnotationsForViewer !== undefined &&
                            res.data.user.fetchAnnotationsForViewer !== null
                        ) {
                            const cue = res.data.user.fetchAnnotationsForViewer.cue;

                            if (cue && cue[0] && cue[0] === '{' && cue[cue.length - 1] === '}') {
                                const obj = JSON.parse(cue);

                                const attempts = obj.attempts;

                                const currAttempt = attempts[attempts.length - 1];

                                const annot = currAttempt.annotations;

                                setAnnotations(annot ? annot : '');
                            }

                            setReleaseSubmission(
                                res.data.user.fetchAnnotationsForViewer.releaseSubmission ? true : false
                            );
                        } else {
                            // No cue attached to URL so then don't render file
                            setInvalidParams(true);
                        }
                        setLoading(false);
                    })
                    .catch(err => {
                        console.log(err);
                        setInvalidParams(true);
                        setLoading(false);
                    });
            }
        } else {
            setInvalidParams(true);
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        if (!url || loading) {
            return;
        }

        WebViewer(
            {
                licenseKey: 'xswED5JutJBccg0DZhBM',
                initialDoc: url,
                enableReadOnlyMode: source === 'CREATE' || source === 'CREATE_SUBMISSION'
            },
            RichText.current
        ).then(async (instance: any) => {
            // FOR CREATE NO NEED TO LOAD ANNOTATIONS

            if (source === 'CREATE' || source === 'CREATE_SUBMISSION') {
                return;
            }
            const { documentViewer, annotationManager } = instance.Core;

            if (!documentViewer || !annotationManager) return;

            annotationManager.setCurrentUser(name);

            // you can now call WebViewer APIs here...
            documentViewer.addEventListener('documentLoaded', async () => {
                // const currCue = subCues[props.cueKey][props.cueIndex];

                if (annotations !== '') {
                    const xfdfString = annotations;

                    annotationManager.importAnnotations(xfdfString).then((annot: any) => {
                        annot.forEach((annotation: any) => {
                            if (source === 'VIEW_SUBMISSION') {
                                // Hide instructor annotations until grades are released
                                if (releaseSubmission && annotation.Author !== name) {
                                    annotationManager.hideAnnotation(annotation);
                                } else {
                                    annotationManager.redrawAnnotation(annotation);
                                }
                            } else {
                                annotationManager.redrawAnnotation(annotation);
                            }
                        });
                    });
                }
            });

            annotationManager.addEventListener(
                'annotationChanged',
                async (annotations: any, action: any, { imported }) => {
                    // If the event is triggered by importing then it can be ignored
                    // This will happen when importing the initial annotations
                    // from the server or individual changes from other users
                    if (imported) return;

                    const xfdfString = await annotationManager.exportAnnotations({ useDisplayAuthor: true });

                    const server = fetchAPI('');

                    server
                        .mutate({
                            mutation: updateAnnotationsFromViewer,
                            variables: {
                                userId,
                                cueId,
                                annotations: xfdfString,
                                source
                            }
                        })
                        .then((res: any) => {
                            if (res.data && res.data.user.updateAnnotationsFromViewer) {
                                console.log('Success');
                            } else {
                                console.log('Error');
                            }
                        });
                }
            );
        });
    }, [url, RichText, cueId, userId, annotations, source, name, releaseSubmission, loading]);

    if (loading) {
        return (
            <View
                style={{
                    width: '100%',
                    height: '100%',
                    // backgroundColor: '#efefef',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'center',
                    alignItems: 'center'
                }}>
                <ActivityIndicator color={'#1F1F1F'} />
            </View>
        );
    }

    if (invalidParams) {
        return (
            <View style={styles.container}>
                <Text style={styles.title}>Could not fetch file.</Text>
            </View>
        );
    }

    return (
        <View style={{ width: '100%', height: '100%' }} key={JSON.stringify(url) + JSON.stringify(annotations)}>
            <div className="webviewer" ref={RichText} style={{ height: '100vh' }}></div>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#fff',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 20
    },
    title: {
        fontSize: 20,
        fontFamily: 'inter'
    },
    link: {
        marginTop: 15,
        paddingVertical: 15
    },
    linkText: {
        fontSize: 14,
        color: '#f9c74f'
    }
});
