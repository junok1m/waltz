import { registerRootComponent } from 'expo';

// Background tasks must be defined at module scope before the app mounts.
import './services/backgroundWalk';
import App from './App';

// registerRootComponent calls AppRegistry.registerComponent('main', () => App);
// It also ensures that whether you load the app in Expo Go or in a native build,
// the environment is set up appropriately
registerRootComponent(App);
