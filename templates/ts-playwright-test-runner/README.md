# Playwright Test

Run your Playwright tests on the Apify Platform effectively and easily. Just set up your test environment using a user-friendly UI and let the platform do the rest.

> Note: This is a custom version of this actor. If you want to use the original simple version, please use the [official actor](https://apify.com/jindrich.bar/playwright-test).
> 
> Unlike the original actor, this version reads test suite files from the `tests` folder and does not allow you to pass the test codes via Apify input.

## Features

### Run your Playwright tests on the Apify Platform

No more pre-commit hooks or CI/CD pipelines. Integrate your tests with the Apify Platform using a user-friendly UI and forget about the hassle of setting up your test environment.

<center>
<img src="https://raw.githubusercontent.com/apify/playwright-test-actor/main/docs/static/actorInput.gif" alt="Test configuration with comprehensive UI">
</center>

### Collect and analyze your test results online

After running the tests, the Apify Platform stores the results in comprehensive datasets. You can view the results directly on the platform or download them to your local machine using a REST API.

<center>
<img src="https://raw.githubusercontent.com/apify/playwright-test-actor/main/docs/static/testReport.gif" alt="Analyzing understandable test reports">
</center>



### No more problems with incompatible browser versions

Playwright Test toolkit automatically downloads the latest versions of Chromium, Firefox, and WebKit browsers and installs them in the Apify Platform. 

This way, you can test your websites using all the popular browsers without worrying about compatibility issues.

<center>
<img src="https://raw.githubusercontent.com/apify/playwright-test-actor/main/docs/static/devices.gif" alt="Testing with multiple browser versions at once">
</center>



## How to use

Just provide your test suite files in the `tests` folder and run the actor. The actor will automatically run all the tests in the `tests` folder and store the results in the KVS/dataset fields.

You can also customize the test run by specifying other options in the input, e.g. the screen size, headful/headless execution or the maximum run time.

### Test Generator

You can also use the Playwright Codegen to compose your test suites even faster. Just run `npm run codegen` in your project folder and record your workflow. 

The code generator will automatically create a test suite file for you and save it in the `tests` folder.
