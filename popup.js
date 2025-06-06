document.addEventListener('DOMContentLoaded', function () {
  const apiKeyInput = document.getElementById('api-key');
  const saveButton = document.getElementById('save-key');
  const testButton = document.getElementById('test-key');
  const messageDiv = document.getElementById('message');
  const statusIndicator = document.getElementById('ai-status');

  let savedApiKey = null; // Store the real key for internal use

  loadApiKey();

  saveButton.addEventListener('click', saveApiKey);
  testButton.addEventListener('click', testApiKey);
  apiKeyInput.addEventListener('input', clearMessage);

  function loadApiKey() {
    chrome.storage.sync.get(['geminiApiKey'], function (result) {
      if (result.geminiApiKey) {
        savedApiKey = result.geminiApiKey;
        apiKeyInput.value = '••••••••••••••••';
        apiKeyInput.dataset.hasKey = 'true';
        updateStatus(true);
      } else {
        updateStatus(false);
      }
    });
  }

  function saveApiKey() {
    const apiKey = apiKeyInput.value.trim();

    if (!apiKey) {
      showMessage('Please enter an API key', 'error');
      return;
    }

    if (apiKey === '••••••••••••••••' && apiKeyInput.dataset.hasKey === 'true') {
      showMessage('API key already saved!', 'success');
      return;
    }

    if (apiKey.length < 20) {
      showMessage('API key seems too short. Please check and try again.', 'error');
      return;
    }

    chrome.storage.sync.set({ geminiApiKey: apiKey }, function () {
      if (chrome.runtime.lastError) {
        showMessage('Failed to save API key: ' + chrome.runtime.lastError.message, 'error');
      } else {
        showMessage('API key saved successfully!', 'success');
        savedApiKey = apiKey;
        apiKeyInput.value = '••••••••••••••••';
        apiKeyInput.dataset.hasKey = 'true';
        updateStatus(true);
        chrome.runtime.sendMessage({ action: 'apiKeyUpdated' });
      }
    });
  }

  function testApiKey() {
    const enteredKey = apiKeyInput.value.trim();
    const isMasked = apiKeyInput.dataset.hasKey === 'true' && enteredKey === '••••••••••••••••';

    const apiKeyToUse = isMasked ? savedApiKey : enteredKey;

    if (!apiKeyToUse) {
      showMessage('Please enter an API key to test', 'error');
      return;
    }

    showMessage('Testing API connection...', 'info');
    testButton.disabled = true;

    chrome.runtime.sendMessage({
      action: 'testApiKey',
      apiKey: apiKeyToUse
    }, function (response) {
      testButton.disabled = false;

      if (response && response.success) {
        showMessage('✅ API connection successful!', 'success');
        updateStatus(true);
      } else {
        showMessage('❌ API test failed: ' + (response?.error || 'Unknown error'), 'error');
        updateStatus(false);
      }
    });
  }

  function clearMessage() {
    messageDiv.innerHTML = '';
    if (apiKeyInput.value !== '••••••••••••••••') {
      apiKeyInput.dataset.hasKey = 'false';
    }
  }

  function showMessage(text, type) {
    messageDiv.innerHTML = `<div class="${type}">${text}</div>`;
    if (type === 'success') {
      setTimeout(() => { messageDiv.innerHTML = ''; }, 3000);
    }
  }

  function updateStatus(isActive) {
    if (isActive) {
      statusIndicator.classList.add('active');
    } else {
      statusIndicator.classList.remove('active');
    }
  }

  chrome.runtime.onMessage.addListener(function (request, sender, sendResponse) {
    if (request.action === 'apiTestResult') {
      testButton.disabled = false;
      if (request.success) {
        showMessage('✅ API connection successful!', 'success');
        updateStatus(true);
      } else {
        showMessage('❌ API test failed: ' + request.error, 'error');
        updateStatus(false);
      }
    }
    sendResponse({ received: true });
  });
});
