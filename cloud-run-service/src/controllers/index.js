class IndexController {
    handleGetRequest(req, res) {
        res.send('GET request handled');
    }

    handlePostRequest(req, res) {
        res.send('POST request handled');
    }

    handlePutRequest(req, res) {
        res.send('PUT request handled');
    }

    handleDeleteRequest(req, res) {
        res.send('DELETE request handled');
    }
}

export default IndexController;