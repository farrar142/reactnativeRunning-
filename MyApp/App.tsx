/**
 * Sample React Native App
 * https://github.com/facebook/react-native
 *
 * Generated with the TypeScript template
 * https://github.com/react-native-community/react-native-template-typescript
 *
 * @format
 */

import React, {ReactNode, useEffect, useRef, useState} from 'react';
import {
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  useColorScheme,
  View,
  Platform,
  PermissionsAndroid,
  Button,
  TextInput,
  NativeSyntheticEvent,
  TextInputChangeEventData,
  Alert,
} from 'react-native';

import {
  Colors,
  DebugInstructions,
  Header,
  LearnMoreLinks,
  ReloadInstructions,
} from 'react-native/Libraries/NewAppScreen';
import Geolocation from 'react-native-geolocation-service';
import {WebView} from 'react-native-webview';
import MyWebView from './src/component/MyWebView';
import {NavigationContainer} from '@react-navigation/native';
import {
  createNativeStackNavigator,
  NativeStackScreenProps,
} from '@react-navigation/native-stack';
const initialRegion = {
  latitude: 36.78825,
  longitude: 127.4324,
};
const requestPermissions = async () => {
  if (Platform.OS === 'ios') {
    // Geolocation.requestAuthorization('always');
    // Geolocation.setRNConfiguration({
    //   skipPermissionRequests: false,
    //   authorizationLevel: 'whenInUse',
    // });
  }

  if (Platform.OS === 'android') {
    await PermissionsAndroid.request(
      PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
    );
  }
};
interface ILocation {
  latitude: number;
  longitude: number;
}

const App = () => {
  return (
    <NavigationContainer>
      <Stack.Navigator initialRouteName="Home">
        <Stack.Screen name="Home" component={Home}></Stack.Screen>
        <Stack.Screen name="Running" component={Running}></Stack.Screen>
        <Stack.Screen name="Result" component={Result}></Stack.Screen>
      </Stack.Navigator>
    </NavigationContainer>
  );
};
const Stack = createNativeStackNavigator();
type RootStackParamList = {
  Home: undefined;
  Running: {name: string; period: number};
  Result: {name: string; period: number};
};
type HomeProps = NativeStackScreenProps<RootStackParamList, 'Home'>;
type RunningProps = NativeStackScreenProps<RootStackParamList, 'Running'>;
type ResultProps = NativeStackScreenProps<RootStackParamList, 'Result'>;
const Home = ({route, navigation}: HomeProps) => {
  const [name, setName] = useState<string>('샌드링');
  useEffect(() => {
    requestPermissions();
  }, []);
  const onChange = (e: NativeSyntheticEvent<TextInputChangeEventData>) => {
    e.preventDefault();
    setName(e.nativeEvent.text);
  };
  return (
    <View style={styles.container}>
      <View
        style={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
        }}>
        <Text style={{color: 'black'}}>이름을 입력해주세요/{name}</Text>
      </View>
      <TextInput style={styles.textInput} value={name} onChange={onChange} />
      <Button
        title="달리기 시작!"
        onPress={async () => {
          if (name == '') {
            Alert.alert(
              '이름을 적어주세요!',
              '적어주세요!',
              [{text: '네', onPress: () => {}}],
              {cancelable: false},
            );
          } else {
            const URL =
              'https://kakaoback.honeycombpizza.link/api/start/running';
            const data = {
              method: 'POST',
              body: JSON.stringify({name}),
              headers: {
                'Content-Type': 'application/json',
              },
            };
            const res = await fetch(URL, data)
              .then(res => res.json())
              .then(res => {
                navigation.navigate('Running', {name, period: res.period});
              })
              .catch(res => console.log('error'));
          }
        }}></Button>
    </View>
  );
};
type StopWatchProps = {
  timeStart: number;
  runStart: boolean;
};
function StopWatch({timeStart, runStart}: StopWatchProps) {
  const [timer, setTimer] = useState<number>(0);
  useEffect(() => {
    if (timeStart) {
      const interval = setInterval(() => {
        setTimer(Date.now() - timeStart);
      }, 200);
      if (!runStart) {
        clearInterval(interval);
      }
      return () => {
        clearInterval(interval);
      };
    }
  }, [timeStart, runStart]);
  const _time = new Date(timer);
  const t = {
    minutes: _time.getMinutes(),
    seconds: _time.getSeconds(),
    mili: _time.getMilliseconds(),
  };
  if (!timeStart) {
    return (
      <View>
        <Text>로딩중이에요</Text>
      </View>
    );
  }
  return (
    <View style={{flex: 1}}>
      <Text style={{color: 'black'}}>
        {t.minutes}분/{t.seconds}초/{t.mili}
      </Text>
    </View>
  );
}
const Running = ({route, navigation}: RunningProps) => {
  const name = route.params.name;
  const period = route.params.period;
  const [started, setStarted] = useState<number>(0);
  const [runStart, setRunStart] = useState<boolean>(true);
  const ws = useWebsocket(name);
  const [location, setLocation] = useState<ILocation>({
    latitude: 0,
    longitude: 0,
  });
  const [[qlat, qlng], setQ] = useState([0, 0]);
  const [offset, setOffset] = useState<number>(0);
  const sendGeo = JSON.stringify({
    location: {
      latitude: location.latitude, // + offset + (Math.random() - 0.5) / 10000,
      longitude: location.longitude, // + offset + (Math.random() - 0.5) / 10000,
    },
    type: 'send_geo',
  });
  useEffect(() => {
    const _watchId = Geolocation.watchPosition(
      position => {
        const {latitude, longitude} = position.coords;
        setLocation({latitude, longitude});
      },
      error => {
        console.log(error);
      },
      {
        enableHighAccuracy: true,
        distanceFilter: 0,
        interval: 100,
        fastestInterval: 50,
      },
    );
    return () => {
      if (_watchId) {
        Geolocation.clearWatch(_watchId);
      }
    };
  }, []);
  useEffect(() => {
    const {latitude, longitude} = location;
    if (!qlat) {
      setQ([latitude, longitude]);
    }
    if (runStart) {
      if (!started && location.latitude && qlat) {
        setStarted(Date.now());
      }
      if (ws) {
        ws.send(sendGeo);
      }
      if (location.latitude && qlat) {
        const URL = 'https://kakaoback.honeycombpizza.link/api/record/running';
        const data = {
          method: 'POST',
          body: JSON.stringify({
            name,
            period,
            latitude: latitude.toString(),
            longitude: longitude.toString(),
          }),
          headers: {
            'Content-Type': 'application/json',
          },
        };
        setOffset(offset + 0.01);
        fetch(URL, data);
      }
    }
  }, [location]);
  return (
    <View style={{flex: 1}}>
      <View>
        <Text style={{color: 'black'}}>
          {name}/{period}/{location.latitude}/{location.longitude}
        </Text>
      </View>
      <StopWatch runStart={runStart} timeStart={started}></StopWatch>
      <View style={{flex: 6}}>
        <MyWebView
          name={`${name}?lat=${qlat.toString()}&lng=${qlng.toString()}`}></MyWebView>
      </View>
      <View
        style={{
          flex: 1,
          flexDirection: 'row',
          justifyContent: 'center',
          alignItems: 'center',
        }}>
        <Button
          title="websocketTest"
          onPress={() => {
            if (ws) {
              ws.send(sendGeo);
            } else {
              Alert.alert('웹소켓이없어요');
            }
          }}></Button>
        <Button title="돌아가기!" />
        <Button
          title="끝내기!"
          onPress={e => {
            setRunStart(false);
            navigation.navigate('Result', {name, period});
          }}
        />
      </View>
    </View>
  );
};
type Geo = {
  lat: string;
  lng: string;
  id: number;
  time: string;
};

const Result = ({route, navigation}: ResultProps) => {
  const {name, period} = route.params;
  const [geos, setGeos] = useState<Array<Geo>>([]);
  useEffect(() => {
    const af = async () => {
      const URL = 'https://kakaoback.honeycombpizza.link/api/result/running';
      const data = {
        method: 'POST',
        body: JSON.stringify({
          period,
        }),
        headers: {
          'Content-Type': 'application/json',
        },
      };
      const res = await fetch(URL, data)
        .then(res => res.json())
        .catch(err => {});
      setGeos(res.geos as Array<Geo>);
    };
    af();
  }, []);
  const startLoc = geos[0];
  const endLoc = geos.reverse()[0];
  console.log(startLoc, endLoc);
  return (
    <View style={{flex: 1}}>
      <MyWebView name={`${period.toString()}/result`}></MyWebView>
    </View>
  );
};
const styles = StyleSheet.create({
  container: {
    backgroundColor: '#eee',
    paddingHorizontal: 30,
    flex: 1,
  },
  headerText: {
    paddingTop: 50,
    alignItems: 'center',
    fontSize: 30,
  },
  bodyContainer: {
    backgroundColor: '#FDF5DC',
    paddingHorizontal: 20,
    marginVertical: 30,
    flex: 1,
  },
  textInput: {
    marginTop: 20,
    marginBottom: 10,
    paddingHorizontal: 10,
    height: 40,
    borderRadius: 10,
    borderColor: 'gray',
    borderWidth: 1,
    color: 'black',
  },
  showText: {
    marginTop: 10,
    fontSize: 25,
  },
});
export default App;
function useWebsocket(id: string) {
  const [_ws, setWs] = useState<WebSocket | null>(null);
  useEffect(() => {
    const ws = new WebSocket(
      `wss://kakaoback.honeycombpizza.link/ws/locate/${encodeURIComponent(
        id,
      )}/`,
    );
    setWs(ws);
    console.log(ws);
    ws.onopen = () => {
      // connection opened
      console.log('connected');
      // send a message
    };

    ws.onmessage = e => {
      // a message was received
      console.log(e.data);
    };

    ws.onerror = e => {
      // an error occurred
      console.log(e);
    };

    ws.onclose = e => {
      // connection closed
      console.log(e.code, e.reason);
    };

    return () => {
      ws.close();
    };
  }, []);
  return _ws;
}
