import { useNavigate } from "react-router-dom";

const Home = ()=>{

    const navigate = useNavigate();

    const createRoomButton = async ()=>{
        try{
            const resp = await fetch('http://localhost:3000/room/create-room',{
                method: 'POST',
            });

            const {roomid} = await resp.json();
            console.log(roomid)
            navigate(`/room/${roomid}`);
        }catch(err){
            console.error("Error creating room:", err);
        }
    };

    const joinRoomButton = ()=>{
        console.log("Join Room button clicked");
    };

    return(
            <div className="flex flex-col h-screen gap-7 bg-gray-700">

            <h1 className="text-4xl text-white font-bold">Brush It</h1>

            <button className='bg-black text-white hover:cursor-pointer '
            onClick={createRoomButton}>Create Room</button>
            <button className='bg-black text-white hover:cursor-pointer'
            onClick={joinRoomButton}>Join Room</button>

            </div>

    );
};

export default Home;