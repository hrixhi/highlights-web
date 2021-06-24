import React, { useState, useCallback } from 'react';
import { StyleSheet, Image } from 'react-native';
import { TextInput } from "./CustomTextInput";
import { Text, TouchableOpacity, View } from '../components/Themed';
import { Ionicons } from '@expo/vector-icons';
import { PreferredLanguageText } from '../helpers/LanguageContext';
import EquationEditor from 'equation-editor-react';
import * as ImagePicker from 'expo-image-picker';

const QuizCreate: React.FunctionComponent<{ [label: string]: any }> = (props: any) => {

    const [problems, setProblems] = useState<any[]>([])

    const galleryCallback = useCallback(async (index: any, i: any) => {
        const gallerySettings = await ImagePicker.getMediaLibraryPermissionsAsync()
        if (!gallerySettings.granted) {
            await ImagePicker.requestMediaLibraryPermissionsAsync()
            const updatedGallerySettings = await ImagePicker.getMediaLibraryPermissionsAsync()
            if (!updatedGallerySettings.granted) {
                return;
            }
        }

        let result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            quality: 1,
            base64: true
        });

        if (!result.cancelled) {
            if (i !== null) {
                const newProbs = [...problems];
                newProbs[index].options[i].option = "image:" + result.uri;
                setProblems(newProbs)
                props.setProblems(newProbs)
            } else {
                const newProbs = [...problems];
                newProbs[index].question = "image:" + result.uri;
                setProblems(newProbs)
                props.setProblems(newProbs)
            }
        }
    }, [problems, props.setProblems])

    return (
        <View style={{
            width: '100%', height: '100%', backgroundColor: 'white',
            borderTopLeftRadius: 30,
            borderTopRightRadius: 30,
            paddingTop: 15,
            flexDirection: 'column',
            justifyContent: 'flex-start'
        }}>
            {
                problems.map((problem: any, index: any) => {
                    return <View style={{ borderBottomColor: '#f4f4f6', borderBottomWidth: index === (problems.length - 1) ? 0 : 1, marginBottom: 25 }}>
                        <View style={{ flexDirection: 'row' }}>
                            <View style={{ paddingTop: 15 }}>
                                <Text style={{ color: '#a2a2aa', fontSize: 17, paddingBottom: 25, marginRight: 10 }}>
                                    {index + 1}.
                            </Text>
                            </View>
                            <View style={{ flexDirection: 'row', width: '95%' }}>
                                <View style={{ width: '50%' }}>
                                    {
                                        problem.question && problem.question.includes("image:") ?
                                            <Image
                                                resizeMode={'contain'}
                                                style={{
                                                    width: 400,
                                                    height: 400,
                                                    maxWidth: '100%'
                                                }}
                                                source={{
                                                    uri: problem.question.split("image:")[1]
                                                }}
                                            />
                                            :
                                            (problem.question && problem.question.includes("formula:") ?
                                                <View style={{
                                                    borderColor: '#f4f4f6',
                                                    borderWidth: 1,
                                                    borderRadius: 15,
                                                    padding: 10,
                                                    width: '50%'
                                                }}>
                                                    <EquationEditor
                                                        value={problem.question.split("formula:")[1]}
                                                        onChange={(eq) => {
                                                            const newProbs = [...problems];
                                                            newProbs[index].question = "formula:" + eq;
                                                            setProblems(newProbs)
                                                            props.setProblems(newProbs)
                                                        }}
                                                        autoCommands="pi theta sqrt sum prod alpha beta gamma rho int"
                                                        autoOperatorNames="sin cos tan arccos arcsin arctan"
                                                    />
                                                </View>
                                                :
                                                <TextInput
                                                    value={problem.question}
                                                    // style={styles.input}
                                                    placeholder={PreferredLanguageText('problem') + (index + 1).toString()}
                                                    onChangeText={val => {
                                                        const newProbs = [...problems];
                                                        newProbs[index].question = val;
                                                        setProblems(newProbs)
                                                        props.setProblems(newProbs)
                                                    }}
                                                    placeholderTextColor={'#a2a2aa'}
                                                    hasMultipleLines={true}
                                                />)
                                    }
                                    <View style={{ flexDirection: 'row' }}>
                                        {
                                            problem.question && problem.question.includes("image:") ? null :
                                                <TouchableOpacity
                                                    style={{
                                                        backgroundColor: '#fff'
                                                    }}
                                                    onPress={() => {
                                                        if (problem.question && problem.question.includes("formula:")) {
                                                            const newProbs = [...problems];
                                                            newProbs[index].question = "";
                                                            setProblems(newProbs)
                                                            props.setProblems(newProbs)
                                                        } else {
                                                            const newProbs = [...problems];
                                                            newProbs[index].question = "formula:";
                                                            setProblems(newProbs)
                                                            props.setProblems(newProbs)
                                                        }
                                                    }}
                                                >
                                                    <Text
                                                        style={{
                                                            paddingTop: problem.question && problem.question.includes("formula:")
                                                                ? 10 : 0,
                                                            color: '#a2a2aa',
                                                            fontFamily: 'Overpass',
                                                            fontSize: 10
                                                        }}
                                                    >
                                                        {
                                                            problem.question && problem.question.includes("formula:")
                                                                ? "Switch to Text" : "Switch to Formula"
                                                        }
                                                    </Text>
                                                </TouchableOpacity>
                                        }
                                        <TouchableOpacity
                                            style={{
                                                backgroundColor: '#fff', paddingLeft: 10
                                            }}
                                            onPress={() => {
                                                if (problem.question && problem.question.includes("image:")) {
                                                    const newProbs = [...problems];
                                                    newProbs[index].question = "";
                                                    setProblems(newProbs)
                                                    props.setProblems(newProbs)
                                                } else {
                                                    galleryCallback(index, null)
                                                }
                                            }}
                                        >
                                            <Text
                                                style={{
                                                    paddingTop: problem.question && (problem.question.includes("image:") || problem.question.includes("formula:"))
                                                        ? 10 : 0,
                                                    color: '#a2a2aa',
                                                    fontFamily: 'Overpass',
                                                    fontSize: 10
                                                }}
                                            >
                                                {
                                                    problem.question && problem.question.includes("image:")
                                                        ? "Remove Image" : "Add Image"
                                                }
                                            </Text>
                                        </TouchableOpacity>
                                    </View>
                                </View>
                                {/* <View style={{ flex: 1 }} /> */}
                                <View style={{ width: '50%' }}>
                                    <TextInput
                                        value={problem.points}
                                        // style={styles.input}
                                        placeholder={PreferredLanguageText('enterPoints')}
                                        onChangeText={val => {
                                            const newProbs = [...problems];
                                            newProbs[index].points = val;
                                            setProblems(newProbs)
                                            props.setProblems(newProbs)
                                        }}
                                        placeholderTextColor={'#a2a2aa'}
                                    />
                                </View>

                            </View>
                            <View style={{ paddingTop: 15, paddingLeft: 10 }}>
                                <Ionicons
                                    name='close-outline'
                                    onPress={() => {
                                        const updatedProblems = [...problems]
                                        updatedProblems.splice(index, 1);
                                        setProblems(updatedProblems)
                                        props.setProblems(updatedProblems)
                                    }}
                                />
                            </View>
                        </View>
                        {
                            problem.options.map((option: any, i: any) => {
                                return <View style={{ flexDirection: 'row' }}>
                                    <View style={{ paddingTop: 15 }}>
                                        <input
                                            style={{ paddingRight: 20 }}
                                            type='checkbox'
                                            value={option.isCorrect.toString()}
                                            onChange={(e) => {
                                                const updatedProblems = [...problems]
                                                updatedProblems[index].options[i].isCorrect = Boolean(e.target.value);
                                                setProblems(updatedProblems)
                                                props.setProblems(updatedProblems)
                                            }}
                                        />
                                    </View>
                                    <View>
                                        {
                                            option.option && option.option.includes("image:") ?
                                                <Image
                                                    resizeMode={'contain'}
                                                    style={{
                                                        width: 200,
                                                        height: 200
                                                    }}
                                                    source={{
                                                        uri: option.option.split("image:")[1]
                                                    }}
                                                />
                                                :
                                                (option.option && option.option.includes("formula:") ?
                                                    <View style={{
                                                        borderColor: '#f4f4f6',
                                                        borderWidth: 1,
                                                        borderRadius: 15,
                                                        padding: 10,
                                                        width: '30%'
                                                    }}>
                                                        <EquationEditor
                                                            value={option.option.split("formula:")[1]}
                                                            onChange={(eq) => {
                                                                const newProbs = [...problems];
                                                                newProbs[index].options[i].option = "formula:" + eq;
                                                                setProblems(newProbs)
                                                                props.setProblems(newProbs)
                                                            }}
                                                            autoCommands="pi theta sqrt sum prod alpha beta gamma rho int"
                                                            autoOperatorNames="sin cos tan arccos arcsin arctan"
                                                        />
                                                    </View> :
                                                    <TextInput
                                                        value={option.option}
                                                        // style={styles.input}
                                                        placeholder={PreferredLanguageText('option') + (i + 1).toString()}
                                                        onChangeText={val => {
                                                            const newProbs = [...problems];
                                                            newProbs[index].options[i].option = val;
                                                            setProblems(newProbs)
                                                            props.setProblems(newProbs)
                                                        }}
                                                        placeholderTextColor={'#a2a2aa'}
                                                    />)
                                        }
                                        <View style={{ flexDirection: 'row' }}>
                                            {
                                                option.option && option.option.includes("image:") ? null :
                                                    <TouchableOpacity
                                                        style={{ backgroundColor: '#fff' }}
                                                        onPress={() => {
                                                            if (option.option && option.option.includes("formula:")) {
                                                                const newProbs = [...problems];
                                                                newProbs[index].options[i].option = "";
                                                                setProblems(newProbs)
                                                                props.setProblems(newProbs)
                                                            } else {
                                                                const newProbs = [...problems];
                                                                newProbs[index].options[i].option = "formula:";
                                                                setProblems(newProbs)
                                                                props.setProblems(newProbs)
                                                            }
                                                        }}
                                                    >
                                                        <Text
                                                            style={{
                                                                paddingTop: option.option && option.option.includes("formula:")
                                                                    ? 10 : 0,
                                                                color: '#a2a2aa',
                                                                fontFamily: 'Overpass',
                                                                fontSize: 10
                                                            }}
                                                        >
                                                            {
                                                                option.option && option.option.includes("formula:")
                                                                    ? "Switch to Text" : "Switch to Formula"
                                                            }
                                                        </Text>
                                                    </TouchableOpacity>
                                            }
                                            <TouchableOpacity
                                                style={{
                                                    backgroundColor: '#fff', paddingLeft: 10
                                                }}
                                                onPress={() => {
                                                    if (option.option && option.option.includes("image:")) {
                                                        const newProbs = [...problems];
                                                        newProbs[index].options[i].option = "";
                                                        setProblems(newProbs)
                                                        props.setProblems(newProbs)
                                                    } else {
                                                        galleryCallback(index, i)
                                                    }
                                                }}
                                            >
                                                <Text
                                                    style={{
                                                        paddingTop: option.option && option.option.includes("formula:")
                                                            ? 10 : 0,
                                                        color: '#a2a2aa',
                                                        fontFamily: 'Overpass',
                                                        fontSize: 10
                                                    }}
                                                >
                                                    {
                                                        option.option && option.option.includes("image:")
                                                            ? "Remove Image" : "Add Image"
                                                    }
                                                </Text>
                                            </TouchableOpacity>
                                        </View>
                                    </View>
                                    <View style={{ paddingTop: 15, paddingLeft: 10 }}>
                                        <Ionicons
                                            name='close-outline'
                                            onPress={() => {
                                                const updatedProblems = [...problems]
                                                updatedProblems[index].options.splice(i, 1);
                                                setProblems(updatedProblems)
                                                props.setProblems(updatedProblems)
                                            }}
                                        />
                                    </View>
                                </View>
                            })
                        }
                        <TouchableOpacity
                            onPress={() => {
                                const updatedProblems = [...problems]
                                updatedProblems[index].options.push({
                                    option: '',
                                    isCorrect: false
                                })
                                setProblems(updatedProblems)
                                props.setProblems(updatedProblems)
                            }}
                            style={{
                                backgroundColor: 'white',
                                overflow: 'hidden',
                                height: 35,
                                maxHeight: 70,
                                marginTop: 15,
                                width: '100%',
                                justifyContent: 'flex-start', flexDirection: 'row',
                                marginBottom: 50
                            }}>
                            <Text style={{
                                textAlign: 'center',
                                lineHeight: 35,
                                color: '#202025',
                                fontSize: 12,
                                backgroundColor: '#f4f4f6',
                                paddingHorizontal: 25,
                                fontFamily: 'inter',
                                height: 35,
                                width: 150,
                                borderRadius: 15,
                                textTransform: 'uppercase'
                            }}>
                                {PreferredLanguageText('addChoice')}
                            </Text>
                        </TouchableOpacity>
                    </View>
                })
            }
            <View>
                <TouchableOpacity
                    onPress={() => {
                        const updatedProblems = [...problems, { question: '', options: [], points: '' }]
                        setProblems(updatedProblems)
                        props.setProblems(updatedProblems)
                    }}
                    style={{
                        backgroundColor: 'white',
                        overflow: 'hidden',
                        height: 35,
                        marginTop: 15,
                        width: '100%', justifyContent: 'center', flexDirection: 'row',
                        marginBottom: 50
                    }}>
                    <Text style={{
                        textAlign: 'center',
                        lineHeight: 35,
                        color: '#202025',
                        fontSize: 12,
                        backgroundColor: '#f4f4f6',
                        paddingHorizontal: 25,
                        fontFamily: 'inter',
                        height: 35,
                        width: 200,
                        borderRadius: 15,
                        textTransform: 'uppercase'
                    }}>
                        {PreferredLanguageText('addProblem')}
                    </Text>
                </TouchableOpacity>
            </View>
        </View >
    );
}

export default QuizCreate;

const styles = StyleSheet.create({
    input: {
        width: '50%',
        borderBottomColor: '#f4f4f6',
        borderBottomWidth: 1,
        fontSize: 15,
        padding: 15,
        paddingTop: 12,
        paddingBottom: 12,
        marginTop: 5,
        marginBottom: 20
    }
});
