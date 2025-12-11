
function generateStatus(start_time, end_time){
    const now = new Date();

    if(now < start_time)    return 'upcoming';
    if(now > end_time)    return 'ended';
    return 'active';
}

export default generateStatus;