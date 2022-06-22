import React, { useState, useEffect } from 'react'
import { StyleSheet, View, Text } from 'react-native';
import * as tf from '@tensorflow/tfjs'
import { cameraWithTensors } from '@tensorflow/tfjs-react-native'
import * as mobilenet from '@tensorflow-models/mobilenet'
import * as Permissions from 'expo-camera'
import { Camera } from 'expo-camera';
import Constants from 'expo-constants'
const TensorCamera = cameraWithTensors(Camera);

export default function App() {
  const [model, setModel] = useState(null)

  useEffect(() => {
    getPermissionAsync()
    tf.ready().then(() => {
      mobilenet.load().then((model) => { 
        setModel(model)
        console.log('READY')
      })
    })
  }, [])

  const getPermissionAsync = async () => {
    const { status } = await Permissions.requestCameraPermissionsAsync()
    if (status !== 'granted') {
      alert('Sorry, we need camera roll permissions to make this work!')
    }
  }

  const getPrediction = async (tensor) => {
    if(!tensor) { return; }
    const prediction = await model.classify(tensor, 1);
    console.log(`prediction: ${JSON.stringify(prediction)}`);
  }

  const handleCameraStream = (images, updatePreview, gl) => {
    let count = 0
    const loop = async () => {
      if (model && count > 15) {
        count = 0
        const nextImageTensor = await images.next().value
        getPrediction(nextImageTensor)
      }
      count++
      updatePreview()
      gl.endFrameEXP()
      requestAnimationFrame(loop);
    }
    loop();
  }

  const textureDims = (Platform.OS === 'ios') ?
    {
      height: 1920,
      width: 1080,
    } : {
      height: 1200,
      width: 1600,
    }

  if (!model) {
    return (
      <View style={styles.container}>
        <Text style={{color: 'white'}}>Loading...</Text>
      </View>
    )
  }

  return (
    <View style={styles.container}>
      <TensorCamera
        type={Camera.Constants.Type.back}
        style={{ flex: 1, height: '100%', width: '100%' }}
        // Tensor related props
        cameraTextureHeight={textureDims.height}
        cameraTextureWidth={textureDims.width}
        resizeHeight={200}
        resizeWidth={152}
        resizeDepth={3}
        onReady={handleCameraStream}
        autorender={false}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#171f24',
    alignItems: 'center',
    justifyContent: 'center'
  },
});
