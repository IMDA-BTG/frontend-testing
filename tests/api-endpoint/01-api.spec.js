import { test, expect, request } from '@playwright/test'
import { MongoClient, ObjectId } from 'mongodb'
import * as api_data from './api-data.js'

import axios from 'axios'
import qs from 'querystring'
import fs from 'fs'
import FormData from 'form-data'

const ENDPOINT = "http://127.0.0.1:3000"

let environment = process.env.ENVIRONMENT_URL

let uri = ""

if(environment == "https://127.0.0.1")
    uri = "mongodb://mongodb:t1oj5L_xQI8dTrVuZ@127.0.0.1:27017/?directConnection=true&serverSelectionTimeoutMS=2000&appName=mongosh+1.6.1";
else if(environment == "https://host.docker.internal")
    uri = "mongodb://mongodb:mongodb@127.0.0.1:27017/?directConnection=true&serverSelectionTimeoutMS=2000&appName=mongosh+1.6.1";

test.describe.configure({ mode: 'serial' });

test.describe('Get Report', () => {

    let project, projectID

    test.beforeAll(async () => {

        // Send Request
        const response = await axios.post(ENDPOINT + "/api/graphql", {
            query: api_data.CREATE_PROJECT,
            variables: api_data.PROJECT_VARIABLES
        })

        project = response.data.data.createProject
        projectID = project.id

    })

    test('Get Non-Generated Report with Valid Project ID', async () => {

        const response = await axios.get(ENDPOINT + "/api/report/" + projectID, {
            validateStatus: function (status) {
                return status < 600; // Resolve only if the status code is less than 600
            }
        })

        expect.soft(response.status).toBe(400)
    })

    test('Get Generated Report with Valid Project ID', async () => {

        let response = await axios.post(ENDPOINT + "/api/graphql", {
            query: api_data.GET_REPORTS
        })

        projectID = response.data.data.projects[0].report.projectID

        response = await axios.get(ENDPOINT + "/api/report/" + projectID, {
            validateStatus: function (status) {
                return status < 600; // Resolve only if the status code is less than 600
            }
        })

        // Assert Response
        expect.soft(response.status).toBe(200)

    })

    test('Get Generated Report with Invalid Project ID', async () => {

        const projectID = "6416da997de481f468cd535"

        const response = await axios.get(ENDPOINT + "/api/report/" + projectID, {
            validateStatus: function (status) {
                return status < 600; // Resolve only if the status code is less than 600
            }
        })

        expect.soft(response.status).toBe(400)
    })

    test('Get Generated Report with Empty Project ID', async () => {

        const response = await axios.get(ENDPOINT + "/api/report/ ", {
            validateStatus: function (status) {
                return status < 600; // Resolve only if the status code is less than 600
            }
        })

        expect.soft(response.status).toBe(404)
    })

})

test.describe('Export As Plugin', () => {

    let template, templateID

    test.beforeAll(async () => {

        const response = await axios.post(ENDPOINT + "/api/graphql", {
            query: api_data.CREATE_PROJECT_TEMPLATE,
            variables: api_data.PROJECT_TEMPLATE_VARIABLES
        })

        template = response.data.data.createProjectTemplate
        templateID = template.id

    })

    test('Export As Plugin with Valid Inputs', async () => {

        const data = qs.stringify({
            'templateId': templateID,
            'pluginGID': 'cd743373-b5bb-4b6c-98e3-2a36a7d5f6b5',
            'templateCID': 'project-0-5598544214335246'
        });

        const response = await axios.post(ENDPOINT + '/api/template/export', data, {
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded'
            },
            validateStatus: function (status) {
                return status < 600; // Resolve only if the status code is less than 600
            }
        })

        expect.soft(response.status).toBe(200)

    })

    test('Export As Plugin with Invalid Template ID', async () => {

        // Non-existing Template ID
        let data = qs.stringify({
            'templateId': '123',
            'pluginGID': 'cd743373-b5bb-4b6c-98e3-2a36a7d5f6b5',
            'templateCID': 'project-0-5598544214335246'
        });

        let response = await axios.post(ENDPOINT + '/api/template/export', data, {
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded'
            },
            validateStatus: function (status) {
                return status < 600; // Resolve only if the status code is less than 600
            }
        })

        expect.soft(response.status).toBe(500)

        // NULL Template ID
        data = qs.stringify({
            'templateId': null,
            'pluginGID': 'cd743373-b5bb-4b6c-98e3-2a36a7d5f6b5',
            'templateCID': 'project-0-5598544214335246'
        });

        response = await axios.post(ENDPOINT + '/api/template/export', data, {
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded'
            },
            validateStatus: function (status) {
                return status < 600; // Resolve only if the status code is less than 600
            }
        })

        expect.soft(response.status).toBe(400)

        // Invalid Template ID Data Type
        data = qs.stringify({
            'templateId': true,
            'pluginGID': 'cd743373-b5bb-4b6c-98e3-2a36a7d5f6b5',
            'templateCID': 'project-0-5598544214335246'
        });

        response = await axios.post(ENDPOINT + '/api/template/export', data, {
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded'
            },
            validateStatus: function (status) {
                return status < 600; // Resolve only if the status code is less than 600
            }
        })

        expect.soft(response.status).toBe(500)

    })

    test('Export As Plugin with Empty Template ID', async () => {

        const data = qs.stringify({
            'templateId': '',
            'pluginGID': 'cd743373-b5bb-4b6c-98e3-2a36a7d5f6b5',
            'templateCID': 'project-0-5598544214335246'
        });

        const response = await axios.post(ENDPOINT + '/api/template/export', data, {
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded'
            },
            validateStatus: function (status) {
                return status < 600; // Resolve only if the status code is less than 600
            }
        })

        expect.soft(response.status).toBe(400)

    })

    test('Export As Plugin with Invalid Plugin GID', async () => {

        // Non-Existing Plugin GID
        let data = qs.stringify({
            'templateId': templateID,
            'pluginGID': '123',
            'templateCID': 'test-1'
        });

        let response = await axios.post(ENDPOINT + '/api/template/export', data, {
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded'
            },
            validateStatus: function (status) {
                return status < 600; // Resolve only if the status code is less than 600
            }
        })

        expect.soft(response.status).toBe(200)

        // NULL Plugin GID
        data = qs.stringify({
            'templateId': templateID,
            'pluginGID': null,
            'templateCID': 'project-0-5598544214335246'
        });

        response = await axios.post(ENDPOINT + '/api/template/export', data, {
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded'
            },
            validateStatus: function (status) {
                return status < 600; // Resolve only if the status code is less than 600
            }
        })

        expect.soft(response.status).toBe(400)

        // Invalid Plugin GID Data Type
        data = qs.stringify({
            'templateId': templateID,
            'pluginGID': true,
            'templateCID': 'project-10'
        });

        response = await axios.post(ENDPOINT + '/api/template/export', data, {
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded'
            },
            validateStatus: function (status) {
                return status < 600; // Resolve only if the status code is less than 600
            }
        })

        expect.soft(response.status).toBe(200)

    })

    test('Export As Plugin with Empty Plugin GID', async () => {

        const data = qs.stringify({
            'templateId': templateID,
            'pluginGID': '',
            'templateCID': 'project-0-5598544214335246'
        });

        const response = await axios.post(ENDPOINT + '/api/template/export', data, {
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded'
            },
            validateStatus: function (status) {
                return status < 600; // Resolve only if the status code is less than 600
            }
        })

        expect.soft(response.status).toBe(400)

    })

    test('Export As Plugin with Invalid Template CID', async () => {

        // Non-Existing Template CID
        let data = qs.stringify({
            'templateId': templateID,
            'pluginGID': 'cd743373-b5bb-4b6c-98e3-2a36a7d5f6b5',
            'templateCID': '123'
        });

        let response = await axios.post(ENDPOINT + '/api/template/export', data, {
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded'
            },
            validateStatus: function (status) {
                return status < 600; // Resolve only if the status code is less than 600
            }
        })

        expect.soft(response.status).toBe(200)

        // NULL Template CID
        data = qs.stringify({
            'templateId': templateID,
            'pluginGID': 'cd743373-b5bb-4b6c-98e3-2a36a7d5f6b5',
            'templateCID': null
        });

        response = await axios.post(ENDPOINT + '/api/template/export', data, {
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded'
            },
            validateStatus: function (status) {
                return status < 600; // Resolve only if the status code is less than 600
            }
        })

        expect.soft(response.status).toBe(400)

        // Invalid Template CID Data Type
        data = qs.stringify({
            'templateId': templateID,
            'pluginGID': 'cd743373-b5bb-4b6c-98e3-2a36a7d5f6b5',
            'templateCID': true
        });

        response = await axios.post(ENDPOINT + '/api/template/export', data, {
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded'
            },
            validateStatus: function (status) {
                return status < 600; // Resolve only if the status code is less than 600
            }
        })

        expect.soft(response.status).toBe(200)

    })

    test('Export As Plugin with Empty Template CID', async () => {

        const data = qs.stringify({
            'templateId': templateID,
            'pluginGID': 'cd743373-b5bb-4b6c-98e3-2a36a7d5f6b5',
            'templateCID': ''
        });

        const response = await axios.post(ENDPOINT + '/api/template/export', data, {
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded'
            },
            validateStatus: function (status) {
                return status < 600; // Resolve only if the status code is less than 600
            }
        })

        expect.soft(response.status).toBe(400)

    })

})

test.describe('Upload Dataset', () => {

    test('Upload Dataset with Valid Dataset', async () => {

        const form_data = new FormData()
        form_data.append('myFiles', fs.createReadStream('./fixtures/sample_bc_credit_data.sav'));

        const response = await axios.post(ENDPOINT + '/api/upload/data', form_data, {
            headers: {
                ...form_data.getHeaders()
            },
            data: form_data,
            validateStatus: function (status) {
                return status < 600; // Resolve only if the status code is less than 600
            }
        })

        expect.soft(response.status).toBe(201)

    })

    test('Upload Dataset with Invalid Dataset', async () => {

        const context = await request.newContext()

        const form_data = new FormData()

        form_data.append('myFiles', fs.createReadStream('./fixtures/pickle_pandas_tabular_loan_testing.sav'));

        const response = await context.post(ENDPOINT + '/api/upload/data', form_data, {
            headers: {
                ...form_data.getHeaders()
            },
            data: form_data,
        })

        expect.soft(response.status()).toBe(400)

    })

    test('Upload Dataset with Empty Dataset', async () => {

        const form_data = new FormData()

        const response = await axios.post(ENDPOINT + '/api/upload/data', form_data, {
            headers: {
                ...form_data.getHeaders()
            },
            data: form_data,
            validateStatus: function (status) {
                return status < 600; // Resolve only if the status code is less than 600
            }
        })

        expect.soft(response.status).toBe(500)

    })

    test('Upload Unsupported File Format Dataset', async () => {

        const context = await request.newContext()
        const form_data = new FormData()
        form_data.append('myFiles', fs.createReadStream('./fixtures/combine_all.sh'));

        const response = await context.post(ENDPOINT + '/api/upload/data', form_data, {
            headers: {
                ...form_data.getHeaders()
            },
            data: form_data,
        })

        expect.soft(response.status()).toBe(400)

    })
})

test.describe('Upload Model', () => {

    test('Upload Model with Valid Model', async () => {

        const form_data = new FormData()
        form_data.append('myModelFiles', fs.createReadStream('./fixtures/sample_bc_credit_sklearn_linear.LogisticRegression.sav'));

        const response = await axios.post(ENDPOINT + '/api/upload/model', form_data, {
            headers: {
                ...form_data.getHeaders()
            },
            data: form_data,
            validateStatus: function (status) {
                return status < 600; // Resolve only if the status code is less than 600
            }
        })

        expect.soft(response.status).toBe(201)

    })

    test('Upload Model with Invalid Model', async () => {

        const context = await request.newContext()
        const form_data = new FormData()

        // TODO Need invalid model
        form_data.append('myModelFiles', fs.createReadStream('./fixtures/combine_all.sh'));

        const response = await context.post(ENDPOINT + '/api/upload/model', form_data, {
            headers: {
                ...form_data.getHeaders()
            },
            data: form_data,
        })

        expect.soft(response.status()).toBe(400)

    })

    test('Upload Model with Empty Model', async () => {

        const form_data = new FormData()

        const response = await axios.post(ENDPOINT + '/api/upload/model', form_data, {
            headers: {
                ...form_data.getHeaders()
            },
            data: form_data,
            validateStatus: function (status) {
                return status < 600; // Resolve only if the status code is less than 600
            }
        })

        expect.soft(response.status).toBe(500)

    })

    test('Upload Model Unsupported File Format Model', async () => {

        const context = await request.newContext()

        const form_data = new FormData()
        form_data.append('myModelFiles', fs.createReadStream('./fixtures/combine_all.sh'));

        const response = await context.post(ENDPOINT + '/api/upload/model', form_data, {
            headers: {
                ...form_data.getHeaders()
            },
            data: form_data,
        })

        expect.soft(response.status()).toBe(400)

    })
})

test.describe('List Plugins', () => {

    test('List All Plugins', async () => {
        const response = await axios.post(ENDPOINT + '/api/plugins/list')
        const plugins = response.data.plugins

        let i = 0

        while (plugins[i]) {
            i++
        }

        expect.soft(i).toBe(10)
    })

})

test.describe('Upload Plugins', () => {

    test('Upload Plugins', async () => {

        const form_data = new FormData()
        form_data.append('myFile', fs.createReadStream('./fixtures/partial_dependence_plot-0.1.0.zip'));

        const response = await axios.post(ENDPOINT + '/api/plugins/upload', form_data, {
            headers: {
                ...form_data.getHeaders()
            },
            data: form_data,
            validateStatus: function (status) {
                return status < 600; // Resolve only if the status code is less than 600
            }
        })

        expect.soft(response.status).toBe(200)
    })

    test('Upload Invalid File', async () => {

        const form_data = new FormData()
        form_data.append('myFile', fs.createReadStream('./fixtures/combine_all.sh'));

        const response = await axios.post(ENDPOINT + '/api/plugins/upload', form_data, {
            headers: {
                ...form_data.getHeaders()
            },
            data: form_data,
            validateStatus: function (status) {
                return status < 600; // Resolve only if the status code is less than 600
            }
        })

        expect.soft(response.status).toBe(400)
    })

    test('Corrupted Plugin Meta JSON File', async () => {
        const form_data = new FormData()
        form_data.append('myFile', fs.createReadStream('./fixtures/aiverify.stock.process-checklist-corrupted.zip'));

        const response = await axios.post(ENDPOINT + '/api/plugins/upload', form_data, {
            headers: {
                ...form_data.getHeaders()
            },
            data: form_data,
            validateStatus: function (status) {
                return status < 600; // Resolve only if the status code is less than 600
            }
        })

        expect.soft(response.status).toBe(400)
    })
})

test.describe('Delete Plugin', () => {

    test('Delete Plugin by Plugin GID', async () => {

        const pluginGID = "partial_dependence_plot-0.1.0"

        let response = await axios.post(ENDPOINT + '/api/plugins/list')
        let plugins = response.data.plugins

        let i = 0, isPluginExist = false

        while (plugins[i]) {
            if (plugins[i].gid == "partial_dependence_plot-0.1.0") {
                isPluginExist = true
                break;
            }
            i++
        }

        response = await axios.delete(ENDPOINT + "/api/plugins/delete/" + pluginGID, {
            validateStatus: function (status) {
                return status < 600; // Resolve only if the status code is less than 600
            }
        })

        isPluginExist = false

        response = await axios.post(ENDPOINT + '/api/plugins/list')
        plugins = response.data.plugins

        while (plugins[i]) {
            if (plugins[i].gid == "partial_dependence_plot-0.1.0") {
                isPluginExist = true
                break;
            }
            i++
        }

        // Assert Response
        expect.soft(isPluginExist).toBeFalsy()
    })

    test('Delete Plugin with Non-existing Plugin GID', async () => {

        const pluginGID = "aiverify.stock.process-checklist"

        const response = await axios.delete(ENDPOINT + "/api/plugins/delete/" + pluginGID, {
            validateStatus: function (status) {
                return status < 600; // Resolve only if the status code is less than 600
            }
        })

        // Assert Response
        expect.soft(response.status).toBe(400)
    })

})