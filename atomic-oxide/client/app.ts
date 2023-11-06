import { ltiLaunch } from '@atomicjolt/lti-client';
import type { LaunchSettings } from '@atomicjolt/lti-client/types';

const launchSettings: LaunchSettings = window.LAUNCH_SETTINGS;
ltiLaunch(launchSettings).then((valid) => {
  if (valid) {
    document.body.innerHTML = 'Hello World';
  } else {
    document.body.innerHTML = 'Failed to launch';
  }

  const jwt = launchSettings.jwt; 
  fetch('/lti_services/names_and_roles', {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${jwt}`,
      'Content-Type': 'application/json'
    }
  })
  .then(response => response.json())
  .then(data => console.log(data))
  .catch((error) => {
    console.error('Error:', error);
  });

});
