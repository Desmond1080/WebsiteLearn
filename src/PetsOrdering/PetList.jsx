import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "../utils/supabaseClient";
import '../css/PetList.css';

function PetList(){
    const [pets, setPets] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        fetchPets();
    }, []);

    async function fetchPets() {
        try{
            console.log('Fetching pets from database...');
            const result = await Promise.race([
                supabase
                    .from('pets')
                    .select('id, name, species, breed, age, status, image_url, created_at')
                    .order('created_at', { ascending: false }),
                new Promise((_, reject) =>
                    setTimeout(() => reject(new Error('Request timeout')), 12000)
                ),
            ]);

            const { data, error } = result;

            if(error){
                console.error('Supabase pets query error:', error);
                setError(error.message);
                
            } else {
                console.log('Pets fetch success. Rows:', data?.length || 0);
                setPets(data || []);
            }
        }catch(error){
            console.error('Unexpected pets fetch error:', error);
            if(error?.message === 'Request timeout'){
                setError('Request timed out while loading pets. Please check your network and Supabase settings.');
            } else {
                setError(error?.message || 'An unexpected error occurred while fetching pets.');
            }
        } finally {
            setLoading(false);
        }
    }

    if(loading) return <p>Loading pets...</p>;
    if(error) return <p>Error loading pets: {error}</p>;
    if(pets.length === 0) return <p>No pets found. Check pets table data or RLS SELECT policy.</p>;

    return(
        <section id="pet-list" className="pet-list">
            <div className="pet-list-header">
                <h1>Available Pets for Adoption</h1>
                <p>Browse pets from different sellers and open a pet to see more details.</p>
            </div>
            {pets.map((pet) => (
                <Link key={pet.id} to={`/pets/${pet.id}`} className="pet-card-link">
                    <div className="pet-card">
                        <div className="pet-image-wrap">
                            {pet.image_url ? (
                                <img src={pet.image_url} alt={pet.name} className="pet-image" />
                            ) : (
                                <div className="pet-image-placeholder">No Image</div>
                            )}
                            <span className="pet-status-badge">{pet.status || 'N/A'}</span>
                        </div>

                        <div className="pet-card-body">
                            <div className="pet-card-topline">
                                <h2>{pet.name}</h2>
                                <span className="pet-card-chip">{pet.species || 'Unknown'}</span>
                            </div>

                            <div className="pet-meta-grid">
                                <div className="pet-meta-item">
                                    <span className="pet-meta-label">Breed</span>
                                    <span className="pet-meta-value">{pet.breed || 'N/A'}</span>
                                </div>
                                <div className="pet-meta-item">
                                    <span className="pet-meta-label">Age</span>
                                    <span className="pet-meta-value">{pet.age ?? 'N/A'}</span>
                                </div>
                            </div>

                            <div className="pet-card-footer">
                                <span className="pet-details-link">View details</span>
                            </div>
                        </div>
                    </div>
                </Link>
            ))}
        </section>
    );    
}

export default PetList