import React, {ReactNode, useEffect, useState} from 'react';
import {WebView} from 'react-native-webview';

type MyWebViewProps = {
  name: string;
};
const MyWebView = (props: MyWebViewProps) => {
  const {name} = props;
  return (
    <WebView
      style={{
        height: '100%',
        width: '100%',
      }}
      source={{uri: `https://kakaomap.honeycombpizza.link/${name}`}}
    />
  );
};
export default MyWebView;
