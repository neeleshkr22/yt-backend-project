import {asyncHandler} from "../utils/asyncHandler"
import {ApiError} from "../utils/ApiError.js"
import {User} from "../models/user.model.js"
import {uploadOnCloudinary} from "../utils/cloudinary.js"
import {ApiResponse} from "../utils/ApiResponse.js"


const generateAccessAndRefreshTokens = async(userId)=>{
    try{
       const user =  await User.findById(userId)
       const accessToken = user.generateAccessToken()
       const refreshToken = user.generateRefreshToken()

       user.refreshToken = refreshToken
       await user.save({validateBeforeSave: false})

       return {accessToken, refreshToken}

    }catch(error){
        throw new ApiError(500,"Something went wrong while genrating refresh and access token")
    }
}

const registerUser = asyncHandler(async(req,res)=>{
    //get user details from frontend
    //validation
    //check if user already exists: username, email
    //check for images check for avatar
    // upload them to coloudinary
    //create user object - create entery in db
    //remove password and refresg token in field from response
    //check for user creation
    //return res
    const {fullname, email, username, password} = req.body

    if ([fullname, email, username, password].some((field)=>{field?.trim()===""})) {
        throw new ApiError(400, "All field are required")
    }
    const existedUser = User.findOne({
        $or: [{username},{email}]    
    })

    if (existedUser) {
        throw new ApiError(409,"User already exist")
    }

    const avatarLocalPath = req.files?.avatar[0]?.path;
    const coverImageLocalPath = req.files?.coverImage[0]?.path

    if(!avatarLocalPath){
        throw new ApiError(400, "avatar file is required")
    }

    const avatar = await uploadOnCloudinary(avatarLocalPath)
    const coverImage = await uploadOnCloudinary(coverImageLocalPath)

    if(!avatar){
        throw new ApiError(400,"avatar is require")
    }

    const user  =  await User.create({
        fullname,
        avatar: avatar.url,
        coverImage: coverImage?.url || "",
        email,
        password,
        username : username.toLowerCase()
    })

    const createdUser = await User.findById(user.__id).select(
        "-password -refreshToken"
    )

    if(!createdUser){
        throw new ApiError(500, "Something went wrong while registering the user")
    }

    return res.status(201).json(
        new ApiResponse(200, createdUser, "User registered successfully")
    )

})

const loginUser = asyncHandler(async(req,res)=>{
    //req body -> data
    //username , email
    //find the user
    //password check
    //access refresh token
    //send cookie
    
    const {email, username, password} = req.body

    if(!username || !email){
        throw new ApiError(400, "Username or password is require")
    }

    const user = await User.findOne({
        $or: [{username}, {email}]
    })
    if(!user){
        throw new ApiError(404,"User does not exist")
    }

    const isPasswordValid = await user.isPasswordCorrect(password)
    if(!isPasswordValid){
        throw new ApiError(401, "password incorrect")
    }

    const {accessToken, refreshToken} = await generateAccessAndRefreshTokens(user._id)

    const loggedInUser = await User.findById(user._id).select("-password -refreshToken")

    const options = {
        httpOnly: true,
        secure: true
    }
    return res
    .status(200)
    .cookie("accessToken", accessToken, options)
    .cookie("refreshToken", refreshToken, options)
    .json(
        new ApiResponse(
            200, {
                user: loggedInUser, accessToken,
                refreshToken
            },
            "user logged in successfully"
        )
    )

})

const logoutUser = asyncHandler(async(req,res)=>{
    await User.findByIdAndUpdate(
        req.user._id,{
            $set: {
                refreshToken: undefined
            }
        },{
            new : true
        }
    )
    const options = {
        httpOnly: true,
        secure: true
    }

    return res.status(200).clearCookie("accessToken", options)
    .clearCookie("refreshToken", options)
    .json(new ApiResponse(200, {}, "user logged out"))
})

export {
    registerUser,
    loginUser,
    logoutUser
}    