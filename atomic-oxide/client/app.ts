import { ltiLaunch } from '@atomicjolt/lti-client';
import type { LaunchSettings } from '@atomicjolt/lti-client/types';

const launchSettings: LaunchSettings = window.LAUNCH_SETTINGS;
ltiLaunch(launchSettings).then((valid) => {
  if (valid) {
    document.body.innerHTML = 'Hello World';
  } else {
    document.body.innerHTML = 'Failed to launch';
  }
});
