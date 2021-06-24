import EquationEditor from 'equation-editor-react';
import React, { useEffect, useState } from 'react';
import { Image, StyleSheet, TextInput } from 'react-native';
import { Text, View } from './Themed';


const Quiz: React.FunctionComponent<{ [label: string]: any }> = (props: any) => {

    const [problems] = useState<any[]>(props.problems)
    const [solutions, setSolutions] = useState<any>([])
    const [updateKey, setUpdateKey] = useState(Math.random())

    useEffect(() => {
        if (props.solutions && props.solutions.length !== 0) {
            setSolutions(props.solutions)
        } else {
            const solutionInit: any = []
            problems.map((problem: any) => {
                const arr: any = []
                problem.options.map((i: any) => {
                    arr.push({
                        options: i.option,
                        isSelected: false
                    })
                })
                solutionInit.push({
                    selected: arr
                })
            })
            setSolutions(solutionInit)
            props.setSolutions(solutionInit)
        }
    }, [problems, props.solutions, props.setSolutions])

    if (problems.length !== solutions.length) {
        return null
    }

    return (
        <View style={{
            width: '100%', height: '100%', backgroundColor: 'white',
            borderTopLeftRadius: 0,
            borderTopRightRadius: 0,
            paddingTop: 15,
            flexDirection: 'column',
            justifyContent: 'flex-start'
        }}
            key={solutions.toString() + updateKey.toString()}
        >
            {
                problems.map((problem: any, index: any) => {
                    return <View style={{ borderBottomColor: '#f4f4f6', borderBottomWidth: index === (problems.length - 1) ? 0 : 1, marginBottom: 25 }} key={index}>
                        <View style={{ flexDirection: 'row' }}>
                            <View style={{ paddingTop: 15 }}>
                                <Text style={{ color: '#a2a2aa', fontSize: 16, paddingBottom: 25, marginRight: 10 }}>
                                    {index + 1}.
                            </Text>
                            </View>
                            {
                                problem.question && problem.question.includes("image:") ?
                                    (<Image
                                        resizeMode={'contain'}
                                        style={{
                                            width: 400,
                                            height: 400
                                        }}
                                        source={{
                                            uri: problem.question.split("image:")[1]
                                        }}
                                    />) :
                                    (
                                        problem.question && problem.question.includes("formula:") ? (
                                            <View style={{
                                                borderColor: '#f4f4f6',
                                                borderWidth: 1,
                                                borderRadius: 15,
                                                padding: 10,
                                                width: '50%'
                                            }}>
                                                <EquationEditor
                                                    value={problem.question.split("formula:")[1]}
                                                    onChange={() => { setUpdateKey(Math.random()) }}
                                                    autoCommands="pi theta sqrt sum prod alpha beta gamma rho int"
                                                    autoOperatorNames="sin cos tan arccos arcsin arctan"
                                                />
                                            </View>
                                        ) :
                                            <TextInput
                                                editable={false}
                                                value={problem.question}
                                                style={styles.input}
                                                placeholder={'Problem ' + (index + 1).toString()}
                                                placeholderTextColor={'#a2a2aa'}
                                            />
                                    )
                            }
                            <TextInput
                                editable={false}
                                value={problem.points + ' Points'}
                                style={styles.input}
                                placeholder={'Enter points'}
                                placeholderTextColor={'#a2a2aa'}
                            />
                        </View>
                        {
                            problem.options.map((option: any, i: any) => {

                                let color = '#202025'
                                if (props.isOwner && option.isCorrect) {
                                    color = '#3B64F8'
                                } else if (props.graded && option.isCorrect && solutions[index].selected[i].isSelected) {
                                    color = '#3B64F8'
                                }

                                return <View style={{ flexDirection: 'row' }} key={solutions.toString() + i.toString()}>
                                    <View style={{ paddingTop: 15 }}>
                                        <input
                                            disabled={props.graded || props.isOwner || props.hasEnded}
                                            style={{ paddingRight: 20 }}
                                            type='checkbox'
                                            value={props.isOwner ? String(option.isCorrect) : String(solutions[index].selected[i].isSelected)}
                                            checked={props.isOwner ? option.isCorrect : solutions[index].selected[i].isSelected}
                                            onChange={(e) => {
                                                const updatedSolution = [...solutions]
                                                updatedSolution[index].selected[i].isSelected = Boolean(!updatedSolution[index].selected[i].isSelected);
                                                setSolutions(updatedSolution)
                                                props.setSolutions(updatedSolution)
                                            }}
                                        />
                                    </View>
                                    {
                                        option.option && option.option.includes("image:") ?
                                            (<Image
                                                resizeMode={'contain'}
                                                style={{
                                                    width: 200,
                                                    height: 200
                                                }}
                                                source={{
                                                    uri: option.option.split("image:")[1]
                                                }}
                                            />) :
                                            (
                                                option.option && option.option.includes("formula:") ?
                                                    <View style={{
                                                        borderColor: '#f4f4f6',
                                                        borderWidth: 1,
                                                        borderRadius: 15,
                                                        padding: 10,
                                                        width: '30%'
                                                    }}>
                                                        <EquationEditor
                                                            value={option.option.split("formula:")[1]}
                                                            onChange={() => { setUpdateKey(Math.random()) }}
                                                            autoCommands="pi theta sqrt sum prod alpha beta gamma rho int"
                                                            autoOperatorNames="sin cos tan arccos arcsin arctan"
                                                        />
                                                    </View> :
                                                    <TextInput
                                                        editable={false}
                                                        value={option.option}
                                                        style={{
                                                            width: '50%',
                                                            fontSize: 15,
                                                            padding: 15,
                                                            paddingTop: 12,
                                                            paddingBottom: 12,
                                                            marginTop: 5,
                                                            marginBottom: 20,
                                                            color
                                                        }}
                                                        placeholder={'Option ' + (i + 1).toString()}
                                                        placeholderTextColor={'#a2a2aa'}
                                                    />
                                            )
                                    }
                                </View>
                            })
                        }
                    </View>
                })
            }
        </View >
    );
}

export default Quiz;

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
